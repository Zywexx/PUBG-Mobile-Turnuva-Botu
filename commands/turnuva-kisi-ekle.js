const { SlashCommandBuilder } = require('discord.js');
const { tournaments, config, formatDate } = require('../utils/tournamentGlobals');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('turnuva-kişi-ekle')
    .setDescription('Bir kullanıcıyı turnuvaya garantili olarak ekler (embed değişmez).')
    .addStringOption(option =>
      option.setName('turnuva_kodu')
        .setDescription('Turnuva kodu')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('kullanici')
        .setDescription('Kullanıcı')
        .setRequired(true)),

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
      const user = interaction.options.getUser('kullanici');
      const tournament = tournaments[code];

      if (!tournament) {
        return interaction.editReply({ content: '❌ Turnuva bulunamadı.' });
      }

      const existingParticipant = tournament.participants.find(p => p.id === user.id);
      if (existingParticipant) {
        existingParticipant.isGuaranteed = true;
        return await interaction.editReply({
          content: `✅ ${user.tag} zaten katılmıştı, garantili olarak işaretlendi.`
        });
      }

      tournament.participants.push({
        name: user.tag,
        id: user.id,
        teamName: `Garanti-${user.username}`,
        teamTag: 'GM',
        joinedAt: formatDate(),
        isGuaranteed: true
      });

      await this.notifyUser(user, tournament);
      await interaction.editReply({ content: `✅ ${user.tag} garantili olarak eklendi.` });
    } catch (error) {
      console.error('Kişi ekleme hatası:', error);
      await interaction.editReply({ 
        content: '❌ Kullanıcı eklenirken bir hata oluştu.', 
        ephemeral: true 
      });
    }
  },

  hasPermission(interaction) {
    return interaction.member.roles.cache.has(config.authorizedRoleId) || 
           interaction.user.id === config.ownerId;
  },

  async notifyUser(user, tournament) {
    try {
      await user.send(`✅ "${tournament.name}" turnuvasına garantili olarak eklendiniz!`);
    } catch (err) {
      console.warn(`DM gönderilemedi (${user.tag}): ${err.message}`);
    }
  }
};