const config = {
  ownerId: process.env.OWNER_ID || '1308888576091619365',
  authorizedRoleId: process.env.AUTHORIZED_ROLE_ID || '1388607226180272218',
  maxTeams: 25,
  teamTagLength: { min: 2, max: 4 },
  teamNameLength: { max: 20 },
  allowedGuildId: process.env.GUILD_ID || '1309829881730830346',
  timeZone: 'Europe/Istanbul'
};

const tournaments = {};
const disabledCommands = new Set();

function generateTournamentCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `T-${result}`;
}

function formatDate(date = new Date()) {
  return date.toLocaleString('tr-TR', { 
    timeZone: config.timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

module.exports = { 
  config, 
  tournaments, 
  disabledCommands, 
  generateTournamentCode,
  formatDate
};