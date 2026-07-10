const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View a player\'s stats')
    .addUserOption(opt =>
      opt.setName('player').setDescription('Player to look up (defaults to you)').setRequired(false)),

  async execute(interaction) {
    const user = interaction.options.getUser('player') ?? interaction.user;

    const res = await pool.query('SELECT * FROM players WHERE discord_id = $1', [user.id]);
    const player = res.rows[0];

    if (!player) {
      return interaction.reply({ content: `❌ ${user.username} has no stats on record yet.`, ephemeral: true });
    }

    let teamName = 'Free agent';
    if (player.team_id) {
      const teamRes = await pool.query('SELECT name FROM teams WHERE id = $1', [player.team_id]);
      if (teamRes.rows[0]) teamName = teamRes.rows[0].name;
    }

    const embed = new EmbedBuilder()
      .setTitle(`📊 ${user.username}'s Stats`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(
        { name: 'Team', value: teamName, inline: true },
        { name: 'Matches Played', value: `${player.matches_played}`, inline: true },
        { name: 'Goals', value: `${player.goals}`, inline: true },
        { name: 'Assists', value: `${player.assists}`, inline: true },
        { name: 'MVPs', value: `${player.mvps}`, inline: true },
      )
      .setColor(0x9b59b6);

    return interaction.reply({ embeds: [embed] });
  },
};
