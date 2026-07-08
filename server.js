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

        // Universal HD-Icon Templates
        const nameTemplate = `[{stream.resolution}] • {stream.type::=debrid["☁️ Debrid"||"🌐 P2P"]} • {service.cached::istrue["⚡ Cached"||"⚪ Uncached"]} • {addon.name}`;
        const descriptionTemplate = `🎥 {stream.quality} • 📦 {stream.size::rbytes} • 🗓️ {stream.year} • {stream.visualTags::join(' ')}`;

        // Build the payload
        const aioConfigPayload = {
            scrapers: scrapers,
            options: {
                cached_only: true,
                max_results: 5,
                resolution_filter: maxQuality !== 'all' ? maxQuality : undefined,
                name_template: nameTemplate,
                description_template: descriptionTemplate
            }
        };

        // Create profile on AIOStreams
        let profileId = 'generated-fallback-id';
        try {
            const aioResponse = await axios.post(`${aioBaseUrl}/api/v1/profiles/create`, aioConfigPayload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 5000
            });
            profileId = aioResponse.data.profile_id || aioResponse.data.id;
        } catch (apiErr) {
            console.error("AIOStreams API Error:", apiErr.message);
            profileId = Math.random().toString(36).substring(2, 15);
        }

        // Process BingeCat Input
        let bcUuid = 'your-uuid';
        const match = bingecatInput.match(/(?:\/stremio\/|\/)([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
        if (match) bcUuid = match[1];
        else if (bingecatInput.length === 36) bcUuid = bingecatInput;

        res.json({
            success: true,
            bingecatManifest: bingecatInput.includes('manifest.json') ? bingecatInput.trim() : `https://bingecat.com/stremio/${bcUuid}/manifest.json`,
            aiostreamsManifest: `${aioBaseUrl}/stremio/${profileId}/manifest.json`
        });

    } catch (error) {
        console.error("Compile Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
