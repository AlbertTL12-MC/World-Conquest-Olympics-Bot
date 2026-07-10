const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pool } = require('../db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('score')
    .setDescription('Update or finish a scheduled match')
    .addIntegerOption(opt =>
      opt.setName('match_id').setDescription('Match ID (see /matchup reply)').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('home').setDescription('Home team score').setRequired(true))
    .addIntegerOption(opt =>
      opt.setName('away').setDescription('Away team score').setRequired(true))
    .addBooleanOption(opt =>
      opt.setName('final').setDescription('Mark this match as finished').setRequired(false)),

  async execute(interaction) {
    const matchId = interaction.options.getInteger('match_id');
    const home = interaction.options.getInteger('home');
    const away = interaction.options.getInteger('away');
    const isFinal = interaction.options.getBoolean('final') ?? false;
    const status = isFinal ? 'finished' : 'live';

    const matchRes = await pool.query(
      `UPDATE matches SET score_home = $1, score_away = $2, status = $3
       WHERE id = $4 RETURNING *`,
      [home, away, status, matchId]
    );

    const match = matchRes.rows[0];
    if (!match) {
      return interaction.reply({ content: '❌ No match found with that ID.', ephemeral: true });
    }

    const team1Res = await pool.query('SELECT name FROM teams WHERE id = $1', [match.team_home]);
    const team2Res = await pool.query('SELECT name FROM teams WHERE id = $1', [match.team_away]);

    // Bump matches_played for every roster player once the match is finalized
    if (isFinal) {
      await pool.query(
        `UPDATE players SET matches_played = matches_played + 1
         WHERE team_id = $1 OR team_id = $2`,
        [match.team_home, match.team_away]
      );
    }

    const embed = new EmbedBuilder()
      .setTitle(isFinal ? '🏁 Final Score' : '🔴 Live Score Update')
      .setDescription(`**${team1Res.rows[0].name}** ${home} - ${away} **${team2Res.rows[0].name}**`)
      .setColor(isFinal ? 0xe74c3c : 0xf1c40f);

    return interaction.reply({ embeds: [embed] });
  },
};
