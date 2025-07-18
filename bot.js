// By Zywexx discord.gg/YAEjW6drVY

const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Events, ActivityType } = require('discord.js');
require('dotenv').config();

const { config, disabledCommands } = require('./utils/tournamentGlobals');

class TournamentBot extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ]
    });

    this.commands = new Collection();
    this.statusMessages = [
      { name: 'Pubg Mobile Scrim Bot', type: ActivityType.Playing },
      { name: 'By Zywexx', type: ActivityType.Watching }
    ];
  }

  async initialize() {
    await this.loadCommands();
    await this.registerCommands();
    this.setupEventHandlers();
    await this.login(process.env.TOKEN);
  }

  async loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      
      if ('data' in command && 'execute' in command) {
        this.commands.set(command.data.name, command);
      } else {
        console.warn(`[UYARI] ${filePath} komut dosyasında "data" veya "execute" özelliği eksik.`);
      }
    }
  }

  async registerCommands() {
    try {
      console.log('🔁 Komutlar Discord API\'ye yükleniyor...');
      const { REST } = require('@discordjs/rest');
      const { Routes } = require('discord-api-types/v10');

      const commands = [...this.commands.values()].map(c => c.data.toJSON());
      await new REST({ version: '10' }).setToken(process.env.TOKEN)
        .put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
      console.log('✅ Komutlar başarıyla yüklendi.');
    } catch (error) {
      console.error('❌ Komut yükleme hatası:', error);
    }
  }

  setupEventHandlers() {
    this.once('ready', () => this.onReady());
    this.on(Events.InteractionCreate, interaction => this.handleInteraction(interaction));
  }

  onReady() {
    console.log(`✅ ${this.user.tag} olarak giriş yapıldı.`);
    this.updatePresence();

    setInterval(() => this.updatePresence(), 15000);
  }

  updatePresence() {
    const status = this.statusMessages[Math.floor(Math.random() * this.statusMessages.length)];
    this.user.setPresence({
      activities: [status],
      status: 'online'
    });
  }

  async handleInteraction(interaction) {
    if (interaction.isChatInputCommand()) {
      await this.handleSlashCommand(interaction);
    } else if (interaction.isButton() || interaction.isModalSubmit()) {
      await this.handleComponentInteraction(interaction);
    }
  }

  async handleSlashCommand(interaction) {
    if (interaction.guildId !== config.allowedGuildId) {
      return interaction.reply({ 
        content: '❌ Bu komut bu sunucuda kullanılamaz.', 
        ephemeral: true 
      });
    }

    const command = this.commands.get(interaction.commandName);
    if (!command) return;

    if (disabledCommands.has(interaction.commandName)) {
      return interaction.reply({ 
        content: '❌ Bu komut şu anda devre dışı.', 
        ephemeral: true 
      });
    }

    try {
      await command.execute(interaction, this);
    } catch (error) {
      console.error(`❌ Komut hatası (${interaction.commandName}):`, error);
      await this.handleCommandError(interaction);
    }
  }

  async handleComponentInteraction(interaction) {
    const command = this.commands.get('turnuva');
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Turnuva etkileşim hatası:', error);
      await interaction.reply({ 
        content: '❌ İşlem sırasında bir hata oluştu.', 
        ephemeral: true 
      }).catch(console.error);
    }
  }

  async handleCommandError(interaction) {
    const errorReply = { 
      content: '❌ Komut çalıştırılırken bir hata oluştu.', 
      ephemeral: true 
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorReply);
    } else {
      await interaction.reply(errorReply);
    }
  }
}

const bot = new TournamentBot();
bot.initialize().catch(console.error);