const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('matchup')
    .setDescription('Schedule a match between two teams')
    .addStringOption(opt =>
      opt.setName('team1').setDescription('Home team name').setRequired(true))
    .addStringOption(opt =>
      opt.setName('team2').setDescription('Away team name').setRequired(true))
    .addStringOption(opt =>
      opt.setName('time')
        .setDescription('When the match happens, e.g. "2026-07-15 18:00"')
        .setRequired(true)),

  async execute(interaction) {
    const team1Name = interaction.options.getString('team1');
    const team2Name = interaction.options.getString('team2');
    const timeStr = interaction.options.getString('time');

    const scheduledAt = new Date(timeStr);
    if (isNaN(scheduledAt.getTime())) {
      return interaction.reply({
        content: '❌ Could not parse that time. Try a format like `2026-07-15 18:00`.',
        ephemeral: true,
      });
    }

    const team1Res = await pool.query('SELECT * FROM teams WHERE name = $1', [team1Name]);
    const team2Res = await pool.query('SELECT * FROM teams WHERE name = $1', [team2Name]);

    if (!team1Res.rows[0] || !team2Res.rows[0]) {
      return interaction.reply({ content: '❌ One or both teams are not registered. Use `/team register` first.', ephemeral: true });
    }

    const team1 = team1Res.rows[0];
    const team2 = team2Res.rows[0];

    const matchRes = await pool.query(
      `INSERT INTO matches (team_home, team_away, scheduled_at, status)
       VALUES ($1, $2, $3, 'scheduled') RETURNING id`,
      [team1.id, team2.id, scheduledAt]
    );

    const embed = new EmbedBuilder()
      .setTitle('⚽ Match Scheduled')
      .setDescription(`**${team1.name}** vs **${team2.name}**`)
      .addFields({ name: 'Kickoff', value: `<t:${Math.floor(scheduledAt.getTime() / 1000)}:F>` })
      .setFooter({ text: `Match ID: ${matchRes.rows[0].id}` })
      .setColor(0x3498db);

    return interaction.reply({ embeds: [embed] });
  },
};
