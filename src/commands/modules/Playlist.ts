import { SlashCommandBuilder } from '@discordjs/builders';
import { UserInteraction, YouTubeInterface, YouTubePlaylist } from 'bot-classes';
import { ResponseEmojis } from 'bot-config';
import { CommandInteraction } from 'discord.js';
import { BaseCommand } from '../BaseCommand';
import { command } from '../decorators/command';

export default class Playlist implements BaseCommand {
	register() {
		return new SlashCommandBuilder()
			.setName('playlist')
			.setDescription(`Import a playlist into the queue.`)
			.addStringOption(option => option.setName('url').setDescription('The URL containing the playlist ID.').setRequired(true));
	}

	@command()
	async runner(commandInteraction: CommandInteraction) {
		const handler = await new UserInteraction(commandInteraction).init(false);

		handler.voiceChannel;

		const audioInterface = YouTubeInterface.fromGuild(handler.guild);
		const playlistUrl = handler.commandInteraction.options.getString('url', true);
		const youtubePlaylist = YouTubePlaylist.fromUrl(playlistUrl);

		if (!youtubePlaylist.id) {
			await handler.editWithEmoji('URL provided is not valid, try again?', ResponseEmojis.Danger);
			return;
		}

		await handler.editWithEmoji('Searching for videos in the playlist. Please wait...', ResponseEmojis.Loading);
		const videoIdsFromPlaylist = await youtubePlaylist.fetchVideosStr('id');
		const awaitingAppendedIds = videoIdsFromPlaylist.map(id => audioInterface.queue.add(id)); // .map(audioInterface.queue.add) won't work.
		const resolvedAppendedIds = await Promise.all(awaitingAppendedIds);
		const filteredAppendedIds = resolvedAppendedIds.filter(Boolean);
		const totalAppendedIds = filteredAppendedIds.length;

		if (totalAppendedIds > 0) {
			await handler.editWithEmoji(`Added ${totalAppendedIds} video${totalAppendedIds > 1 ? 's' : ''} to the queue.`, ResponseEmojis.Success);
		} else {
			await handler.editWithEmoji('Failed to add playlist items to the queue. Is the URL valid?', ResponseEmojis.Danger);
		}
	}
}
