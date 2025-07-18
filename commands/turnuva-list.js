const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { tournaments } = require('../utils/tournamentGlobals');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('turnuva-list')
    .setDescription('Aktif turnuvaları listeler'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const activeTournaments = Object.values(tournaments).filter(t => t.status === 'open');
      if (activeTournaments.length === 0) {
        return interaction.editReply({ 
          content: '📭 Şu anda açık turnuva yok.', 
          ephemeral: true 
        });
      }

      const embed = this.createTournamentListEmbed(activeTournaments);
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Turnuva listeleme hatası:', error);
      await interaction.editReply({ 
        content: '❌ Turnuvalar listelenirken bir hata oluştu.', 
        ephemeral: true 
      });
    }
  },

  createTournamentListEmbed(tournaments) {
    const embed = new EmbedBuilder()
      .setTitle('📋 Aktif Turnuvalar')
      .setColor('#0099ff')
      .setTimestamp();

    for (const tournament of tournaments) {
      const participantLines = tournament.participants.map((p, i) => {
        return `${i + 1}. ${p.name || 'Bilinmiyor'} - ${p.teamName || 'Yok'} - ${p.teamTag || '--'}`;
      });

      const teamCount = new Set(
        tournament.participants
          .filter(p => p.teamTag)
          .map(p => p.teamTag)
      ).size;

      embed.addFields({
        name: `🏆 ${tournament.name} (${tournament.code})`,
        value:
          `⏰ ${tournament.startTime} | 🗺️ ${tournament.map} | 👥 ${tournament.participants.length}/${tournament.limit}\n\n` +
          (participantLines.length > 0 ? participantLines.join('\n') : 'Henüz katılımcı yok.') +
          `\n\n📌 Toplam Takım: **${teamCount}**`
      });
    }

    return embed;
  }
};