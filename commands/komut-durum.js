const { SlashCommandBuilder } = require('discord.js');
const { disabledCommands, config } = require('../utils/tournamentGlobals');

const COMMAND_CHOICES = [
  { name: 'turnuva', value: 'turnuva' },
  { name: 'turnuva-list', value: 'turnuva-list' },
  { name: 'turnuva-kapat', value: 'turnuva-kapat' },
  { name: 'komut-durum', value: 'komut-durum' }
];

const STATUS_CHOICES = [
  { name: 'Aktif', value: 'aktif' },
  { name: 'Pasif', value: 'pasif' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('komut-durum')
    .setDescription('Komut durumunu değiştirir (Sadece yöneticiler)')
    .addStringOption(option => 
      option.setName('komut')
        .setDescription('Komut adı')
        .setRequired(true)
        .addChoices(...COMMAND_CHOICES))
    .addStringOption(option => 
      option.setName('durum')
        .setDescription('Komut durumu')
        .setRequired(true)
        .addChoices(...STATUS_CHOICES)),

  async execute(interaction) {
    try {
      if (!this.hasPermission(interaction)) {
        return await interaction.reply({ 
          content: '❌ Bu komutu kullanma yetkiniz yok.', 
          ephemeral: true 
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const commandName = interaction.options.getString('komut');
      const status = interaction.options.getString('durum');

      this.updateCommandStatus(commandName, status);

      await interaction.editReply({
        content: `✅ \`${commandName}\` komutu artık **${status.toUpperCase()}** durumda.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Komut durumu değiştirme hatası:', error);
      await interaction.editReply({ 
        content: '❌ Komut durumu değiştirilirken bir hata oluştu.', 
        ephemeral: true 
      });
    }
  },

  hasPermission(interaction) {
    return interaction.user.id === config.ownerId || 
           interaction.member.roles.cache.has(config.authorizedRoleId);
  },

  updateCommandStatus(commandName, status) {
    if (status === 'pasif') {
      disabledCommands.add(commandName);
    } else {
      disabledCommands.delete(commandName);
    }
  }
};