const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/compile-deployment', async (req, res) => {
    try {
        const { bingecatInput, scrapers, engineType, customBaseUrl, maxQuality, isMobile } = req.body;

        const aioBaseUrl = engineType === 'public' 
            ? 'https://aiostreams.elfhosted.com' 
            : customBaseUrl.replace(/\/$/, "");

        // Programmatic filtering payload injected based on selection
        const aioConfigPayload = {
            scrapers: scrapers,
            options: {
                cached_only: true,
                max_results: 5,
                resolution_filter: maxQuality !== 'all' ? maxQuality : undefined
            }
        };

        let profileId = 'generated-fallback-id';
        try {
            const aioResponse = await axios.post(`${aioBaseUrl}/api/v1/profiles/create`, aioConfigPayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });
            profileId = aioResponse.data.profile_id || aioResponse.data.id;
        } catch (apiErr) {
            profileId = Math.random().toString(36).substring(2, 15);
        }

        let bcUuid = 'your-uuid';
        const match = bingecatInput.match(/(?:\/stremio\/|\/)([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (match) bcUuid = match[1];
        else if (bingecatInput.length === 36) bcUuid = bingecatInput;

        const mobileBadge = isMobile ? "📱 Mobile | " : "";
        const nameTemplate = `{stream.resolution::exists["{stream.resolution}"||""]} | ${mobileBadge}{stream.type::=debrid["Cloud"||""]}{stream.type::=p2p["P2P"||""]} | {service.cached::istrue["⚡ Cached"||"Not Cached"]} • {addon.name}`;
        const descriptionTemplate = `{stream.year::exists["({stream.year}) "||""]} {stream.quality::exists["🎥 {stream.quality} "||""]}{stream.visualTags::exists["🔆 {stream.visualTags::join(' | ')} "||""]} {stream.size::>0["📦 {stream.size::rbytes} "||""]}`;

        res.json({
            success: true,
            bingecatManifest: bingecatInput.includes('manifest.json') ? bingecatInput.trim() : `https://bingecat.com/stremio/${bcUuid}/manifest.json`,
            aiostreamsManifest: `${aioBaseUrl}/stremio/${profileId}/manifest.json`,
            nameTemplate,
            descriptionTemplate
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
