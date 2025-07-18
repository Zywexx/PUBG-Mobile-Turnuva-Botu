const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { tournaments, config } = require('../utils/tournamentGlobals');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('turnuva-kapat')
    .setDescription('Turnuvayı kapatır ve kazananları belirler')
    .addStringOption(option =>
      option.setName('turnuva_kodu')
        .setDescription('Turnuva kodu')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('oda_id')
        .setDescription('Oda ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('oda_sifre')
        .setDescription('Oda Şifresi')
        .setRequired(false)),

  async execute(interaction, client) {
    try {
      if (!this.hasPermission(interaction)) {
        return await interaction.reply({ 
          content: '⛔ Bu komutu kullanmak için yetkiniz yok.', 
          ephemeral: true 
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const code = interaction.options.getString('turnuva_kodu');
      const roomId = interaction.options.getString('oda_id');
      const roomPass = interaction.options.getString('oda_sifre') || 'Şifre yok';

      const tournament = tournaments[code];
      if (!tournament) {
        return interaction.editReply({ 
          content: '❌ Turnuva bulunamadı.', 
          ephemeral: true 
        });
      }

      if (!this.isCreatorOrOwner(interaction, tournament)) {
        return interaction.editReply({
          content: '⛔ Sadece turnuvayı oluşturan kişi veya bot sahibi kapatabilir.',
          ephemeral: true
        });
      }

      tournament.status = 'closed';
      const winners = this.selectWinners(tournament);
      const assignedTeams = await this.notifyWinners(client, winners, tournament, roomId, roomPass);
      
      const resultEmbed = this.createResultEmbed(tournament, assignedTeams);
      await interaction.editReply({ embeds: [resultEmbed] });

      await this.updateTournamentStatusMessage(interaction, tournament);
    } catch (error) {
      console.error('Turnuva kapatma hatası:', error);
      await interaction.editReply({ 
        content: '❌ Turnuva kapatılırken bir hata oluştu.', 
        ephemeral: true 
      });
    }
  },

  hasPermission(interaction) {
    return interaction.member.roles.cache.has(config.authorizedRoleId) || 
           interaction.user.id === config.ownerId;
  },

  isCreatorOrOwner(interaction, tournament) {
    return tournament.creator === interaction.user.id || 
           interaction.user.id === config.ownerId;
  },

  selectWinners(tournament) {
    const guaranteed = tournament.participants.filter(p => p.isGuaranteed === true);
    const others = tournament.participants.filter(p => !p.isGuaranteed);
    const remainingSlots = tournament.limit - guaranteed.length;
    
    const randoms = others
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.max(0, remainingSlots));

    return [...guaranteed, ...randoms];
  },

  async notifyWinners(client, winners, tournament, roomId, roomPass) {
    const slots = Array.from({ length: config.maxTeams }, (_, i) => i + 1)
      .sort(() => Math.random() - 0.5)
      .slice(0, winners.length);

    const notificationResults = await Promise.all(
      winners.map(async (team, i) => {
        const slot = slots[i];
        try {
          const user = await client.users.fetch(team.id);
          await user.send({
            embeds: [
              new EmbedBuilder()
                .setTitle(`${tournament.name} Turnuvası`)
                .setDescription('🎉 Turnuvaya seçildiniz!')
                .addFields(
                  { name: 'Takım', value: `${team.teamName} [${team.teamTag}]`, inline: true },
                  { name: 'Slot', value: `#${slot}`, inline: true },
                  { name: 'Oda ID', value: roomId, inline: true },
                  { name: 'Şifre', value: roomPass, inline: true }
                )
                .setColor('Green')
                .setTimestamp()
            ]
          });
          return { ...team, slot, notified: true };
        } catch (err) {
          console.error(`DM gönderilemedi (${team.name}):`, err.message);
          return { ...team, slot, notified: false };
        }
      })
    );

    return notificationResults;
  },

  createResultEmbed(tournament, assignedTeams) {
    return new EmbedBuilder()
      .setTitle(`🏁 ${tournament.name} Sonuçları`)
      .setDescription(`${assignedTeams.length} takım seçildi.`)
      .addFields({
        name: 'Kazananlar',
        value: assignedTeams.map(t =>
          `Slot ${t.slot}: ${t.teamName} [${t.teamTag}] ${t.notified ? '✅' : '❌ (DM gönderilemedi)'}`
        ).join('\n')
      })
      .setColor('#FFA500')
      .setTimestamp();
  },

  async updateTournamentStatusMessage(interaction, tournament) {
    if (!tournament.messageId) return;

    try {
      const originalMessage = await interaction.channel.messages.fetch(tournament.messageId);
      if (originalMessage.embeds.length > 0) {
        const oldEmbed = originalMessage.embeds[0];
        const safeTitle = oldEmbed?.title || tournament.name || 'Turnuva';
        const closedEmbed = EmbedBuilder.from(oldEmbed)
          .setTitle(`[KAPANDI] ${safeTitle}`)
          .setColor('#ff0000');

        await originalMessage.edit({
          embeds: [closedEmbed],
          components: []
        });
      }
    } catch (error) {
      console.error('Turnuva mesajı güncellenirken hata:', error);
    }
  }
};