const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('team')
    .setDescription('Manage football/futsal teams')
    .addSubcommand(sub =>
      sub.setName('register')
        .setDescription('Register a new team (you become the captain)')
        .addStringOption(opt =>
          opt.setName('name').setDescription('Team name').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('Add a player to your team (captain only)')
        .addUserOption(opt =>
          opt.setName('player').setDescription('Player to add').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('Remove a player from your team (captain only)')
        .addUserOption(opt =>
          opt.setName('player').setDescription('Player to remove').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('roster')
        .setDescription('View a team roster')
        .addStringOption(opt =>
          opt.setName('name').setDescription('Team name').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'register') {
      const name = interaction.options.getString('name');
      try {
        await pool.query(
          'INSERT INTO teams (name, captain_id) VALUES ($1, $2)',
          [name, interaction.user.id]
        );
        return interaction.reply(`✅ Team **${name}** registered! You're the captain.`);
      } catch (err) {
        if (err.code === '23505') {
          return interaction.reply({ content: '❌ A team with that name already exists.', ephemeral: true });
        }
        console.error(err);
        return interaction.reply({ content: '❌ Something went wrong registering the team.', ephemeral: true });
      }
    }

    if (sub === 'add' || sub === 'remove') {
      const player = interaction.options.getUser('player');

      const teamRes = await pool.query('SELECT * FROM teams WHERE captain_id = $1', [interaction.user.id]);
      const team = teamRes.rows[0];
      if (!team) {
        return interaction.reply({ content: '❌ You are not a captain of any team.', ephemeral: true });
      }

      if (sub === 'add') {
        await pool.query(
          `INSERT INTO players (discord_id, team_id)
           VALUES ($1, $2)
           ON CONFLICT (discord_id) DO UPDATE SET team_id = $2`,
          [player.id, team.id]
        );
        return interaction.reply(`✅ Added ${player} to **${team.name}**.`);
      } else {
        await pool.query(
          'UPDATE players SET team_id = NULL WHERE discord_id = $1 AND team_id = $2',
          [player.id, team.id]
        );
        return interaction.reply(`✅ Removed ${player} from **${team.name}**.`);
      }
    }

    if (sub === 'roster') {
      const name = interaction.options.getString('name');
      const teamRes = await pool.query('SELECT * FROM teams WHERE name = $1', [name]);
      const team = teamRes.rows[0];
      if (!team) {
        return interaction.reply({ content: '❌ Team not found.', ephemeral: true });
      }

      const playersRes = await pool.query('SELECT * FROM players WHERE team_id = $1', [team.id]);
      const roster = playersRes.rows.length
        ? playersRes.rows.map(p => `<@${p.discord_id}> — ${p.goals}G / ${p.assists}A`).join('\n')
        : 'No players yet.';

      const embed = new EmbedBuilder()
        .setTitle(`📋 ${team.name} Roster`)
        .setDescription(roster)
        .setFooter({ text: `Captain: <@${team.captain_id}>` })
        .setColor(0x2ecc71);

      return interaction.reply({ embeds: [embed] });
    }
  },
};
