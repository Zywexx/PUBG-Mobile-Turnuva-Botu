const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');
const { tournaments, config, generateTournamentCode, formatDate } = require('../utils/tournamentGlobals');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('turnuva')
    .setDescription('Yeni bir turnuva başlatır')
    .addStringOption(option =>
      option.setName('turnuva_adi')
        .setDescription('Turnuva adı')
        .setRequired(true)
        .setMaxLength(50))
    .addIntegerOption(option =>
      option.setName('takim_siniri')
        .setDescription('Maksimum takım sayısı (sadece gösterim içindir)')
        .setRequired(true)
        .setMinValue(1))
    .addStringOption(option =>
      option.setName('baslangic_saati')
        .setDescription('Başlangıç saati (HH:MM formatında, örn: 20:30)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('harita')
        .setDescription('Turnuvada oynanacak harita')
        .setRequired(true)
        .addChoices(
          ...['Erangel', 'Miramar', 'Sanhok', 'Vikendi', 'Livik', 'Nusa', 'Karakin', 'Haven']
            .map(map => ({ name: map, value: map }))
        )),

  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        await this.handleSlashCommand(interaction);
      } else if (interaction.isButton()) {
        await this.handleButtonInteraction(interaction);
      } else if (interaction.isModalSubmit()) {
        await this.handleModalSubmit(interaction);
      }
    } catch (error) {
      console.error('Turnuva komutunda hata:', error);
      await this.handleError(interaction, error);
    }
  },

  async handleError(interaction, error) {
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: '❌ Bir hata oluştu. Lütfen tekrar deneyin.', 
        ephemeral: true 
      }).catch(console.error);
    } else if (interaction.deferred) {
      await interaction.followUp({ 
        content: '❌ Bir hata oluştu. Lütfen tekrar deneyin.', 
        ephemeral: true 
      }).catch(console.error);
    }
  },

  async handleSlashCommand(interaction) {
    if (!this.hasPermission(interaction)) {
      return await interaction.reply({ 
        content: '⛔ Bu komutu kullanmak için yetkiniz yok.', 
        ephemeral: true 
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const name = interaction.options.getString('turnuva_adi');
    const limit = interaction.options.getInteger('takim_siniri');
    const time = interaction.options.getString('baslangic_saati');
    const map = interaction.options.getString('harita');
    
    if (!this.validateTimeFormat(time)) {
      return await interaction.editReply({ 
        content: '❌ Geçersiz saat formatı. Lütfen HH:MM formatında girin (örnek: 20:30).' 
      });
    }

    const code = generateTournamentCode();
    const tournamentData = {
      name,
      limit,
      participants: [],
      status: 'open',
      creator: interaction.user.id,
      createdAt: formatDate(),
      startTime: time,
      code,
      map,
      messageId: null
    };

    tournaments[code] = tournamentData;

    const embed = this.createTournamentEmbed(tournamentData, interaction.user.username);
    const button = this.createJoinButton(code);

    await interaction.editReply({ content: `✅ "${name}" turnuvası oluşturuldu! Turnuva kodu: ${code}` });

    const tournamentMessage = await interaction.channel.send({
      embeds: [embed],
      components: [button]
    });

    tournaments[code].messageId = tournamentMessage.id;
  },

  hasPermission(interaction) {
    return interaction.member.roles.cache.has(config.authorizedRoleId) || 
           interaction.user.id === config.ownerId;
  },

  validateTimeFormat(time) {
    return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  },

  createTournamentEmbed(tournament, creatorName) {
    return new EmbedBuilder()
      .setTitle(`🎮 ${tournament.name} Turnuvası`)
      .addFields(
        { name: 'Başlangıç', value: tournament.startTime },
        { name: 'Harita', value: tournament.map, inline: true },
        { name: 'Turnuva Kodu', value: tournament.code, inline: true },
        { name: 'Katılımcılar', value: `0/${tournament.limit}`, inline: true }
      )
      .setColor('#00ff00')
      .setFooter({ text: `Oluşturan: ${creatorName}` })
      .setTimestamp();
  },

  createJoinButton(code) {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`join_${code}`)
        .setLabel('Katıl')
        .setStyle(ButtonStyle.Primary)
    );
  },

  async handleButtonInteraction(interaction) {
    const [action, code] = interaction.customId.split('_');
    if (action !== 'join') return;

    const tournament = tournaments[code];
    
    if (!tournament || tournament.status !== 'open') {
      return await interaction.reply({ 
        content: '❌ Geçersiz veya kapalı turnuva.', 
        ephemeral: true 
      });
    }

    if (tournament.participants.some(p => p.id === interaction.user.id)) {
      return await interaction.reply({ 
        content: '❌ Zaten katıldınız!', 
        ephemeral: true 
      });
    }

    const modal = this.createRegistrationModal(code);
    await interaction.showModal(modal);
  },

  createRegistrationModal(code) {
    return new ModalBuilder()
      .setCustomId(`register_${code}`)
      .setTitle('Turnuva Kayıt Formu')
      .addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('team_name')
            .setLabel('Takım Adı')
            .setStyle(TextInputStyle.Short)
            .setMaxLength(config.teamNameLength.max)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('team_tag')
            .setLabel('Takım Tagı')
            .setStyle(TextInputStyle.Short)
            .setMinLength(config.teamTagLength.min)
            .setMaxLength(config.teamTagLength.max)
            .setRequired(true)
        )
      );
  },

  async handleModalSubmit(interaction) {
    const [action, code] = interaction.customId.split('_');
    if (action !== 'register') return;

    await interaction.deferReply({ ephemeral: true });

    const tournament = tournaments[code];
    if (!tournament) {
      return await interaction.editReply({ 
        content: '❌ Turnuva bulunamadı.', 
        ephemeral: true 
      });
    }

    if (tournament.participants.some(p => p.id === interaction.user.id)) {
      return await interaction.editReply({ 
        content: '❌ Zaten turnuvaya kayıtlısınız.', 
        ephemeral: true 
      });
    }

    const teamName = interaction.fields.getTextInputValue('team_name');
    const teamTag = interaction.fields.getTextInputValue('team_tag');

    tournament.participants.push({
      name: interaction.user.tag,
      id: interaction.user.id,
      teamName,
      teamTag,
      joinedAt: formatDate()
    });

    await interaction.editReply({
      content: `✅ **${teamName} [${teamTag}]** takımı olarak turnuvaya kaydoldunuz!`,
      ephemeral: true
    });

    await this.updateTournamentMessage(interaction, tournament);
  },

  async updateTournamentMessage(interaction, tournament) {
    if (!tournament.messageId) return;

    try {
      const originalMessage = await interaction.channel.messages.fetch(tournament.messageId);
      const originalEmbed = originalMessage.embeds[0];

      const updatedEmbed = EmbedBuilder.from(originalEmbed)
        .spliceFields(3, 1, {
          name: 'Katılımcılar',
          value: `${tournament.participants.length}/${tournament.limit}`,
          inline: true
        });

      await originalMessage.edit({ embeds: [updatedEmbed] });
    } catch (error) {
      console.error('Turnuva mesajı güncellenirken hata:', error);
    }
  }
};