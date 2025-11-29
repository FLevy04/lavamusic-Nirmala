import { Message, TextChannel } from "discord.js";
import Event from "../../structures/Event"; // PERBAIKAN: Menggunakan default import (tanpa kurung kurawal)
import { LavaClient } from "../../structures/LavaClient";

export default class EmbedFixer extends Event {
    constructor(client: LavaClient, file: string) {
        // PERBAIKAN: Mengoper parameter 'file' dan object 'options' sesuai struktur Event LavaMusic
        super(client, file, {
            name: "messageCreate"
        });
    }

    public async run(message: Message): Promise<void> {
        // Abaikan pesan dari bot
        if (message.author.bot) return;
        // Pastikan pesan ada di TextChannel (bukan DM)
        if (!message.inGuild()) return;

        let originalContent = message.content;
        let newContent = originalContent;
        
        // Kita gunakan interface untuk tipe data custom
        interface LinkFix {
            type: string;
            original: string;
            fixed: string;
        }
        
        let linksToFix: LinkFix[] = [];

        // --- Definisi Regex ---
        const instagramRegex = /https?:\/\/(www\.)?instagram\.com\/\S+/g;
        const pixivRegex = /https?:\/\/www\.pixiv\.net\/\S+/g;
        const twitterRegex = /https?:\/\/(www\.)?(twitter|x)\.com\/\S+/g;

        // --- Deteksi Link Instagram ---
        let igMatches;
        while ((igMatches = instagramRegex.exec(originalContent)) !== null) {
            if (!igMatches[0].includes('ddinstagram') && !igMatches[0].includes('d.vxinstagram')) {
                linksToFix.push({
                    type: 'Instagram',
                    original: igMatches[0],
                    fixed: igMatches[0].replace('instagram.com', 'ddinstagram.com')
                });
            }
        }

        // --- Deteksi Link Pixiv ---
        let pixivMatches;
        while ((pixivMatches = pixivRegex.exec(originalContent)) !== null) {
            if (!pixivMatches[0].includes('phixiv')) {
                linksToFix.push({
                    type: 'Pixiv',
                    original: pixivMatches[0],
                    fixed: pixivMatches[0].replace('pixiv.net', 'phixiv.net')
                });
            }
        }

        // --- Deteksi Link Twitter/X ---
        let twMatches;
        while ((twMatches = twitterRegex.exec(originalContent)) !== null) {
            if (!twMatches[0].includes('fxtwitter') && !twMatches[0].includes('vxtwitter')) {
                linksToFix.push({
                    type: 'Twitter',
                    original: twMatches[0],
                    fixed: twMatches[0].replace(/(twitter|x)\.com/, 'fxtwitter.com')
                });
            }
        }

        // --- Eksekusi Fixer ---
        if (linksToFix.length > 0) {
            // Ganti link di pesan asli dengan format [Type Link](url)
            linksToFix.forEach((link, index) => {
                const linkText = linksToFix.length > 1 ? `${link.type} Link ${index + 1}` : `${link.type} Link`;
                newContent = newContent.replace(link.original, `[${linkText}](${link.fixed})`);
            });

            try {
                // Kirim pesan baru
                await message.channel.send({
                    content: `Pesan dari ${message.author}:\n\n> ${newContent}`,
                    allowedMentions: { repliedUser: false, users: [], roles: [], everyone: false }
                });

                // Hapus pesan asli jika bisa
                if (message.deletable) {
                    await message.delete().catch(() => {});
                }

            } catch (err) {
                console.log("[EmbedFixer] Gagal membalas atau menghapus pesan.", err);
            }
        }
    }
}