/**
 * ZAHID-KING-MD - Render Deployment Manager
 * Automatically triggers new builds on Render.com
 */

const axios = require("axios");

async function deployLatestCommit(serviceId, apiKey) {
  // 1. Check for required Credentials
  if (!serviceId || !apiKey) {
    console.error("❌ [Render Engine]: Missing Service ID or API Key.");
    return;
  }

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  try {
    console.log("🔄 [Render Engine]: Preparing deployment for ZAHID-KING-MD...");

    // 2. Disable Autoscaling (To prevent multiple instances during deploy)
    const autoScalingUrl = `https://api.render.com/v1/services/${serviceId}/autoscaling`;
    try {
      await axios.delete(autoScalingUrl, { headers });
      console.log("✅ [Render Engine]: Autoscaling managed.");
    } catch (err) {
      // Logic continue even if autoscaling was already disabled
    }

    // 3. Trigger New Deployment with Clear Cache
    const deployUrl = `https://api.render.com/v1/services/${serviceId}/deploys`;
    const response = await axios.post(
      deployUrl,
      { clearCache: "clear" },
      { headers: { ...headers, "Content-Type": "application/json" } }
    );

    const { id, status, trigger, commit } = response.data;

    console.log("\n🚀 [ZAHID-KING-MD]: Deployment Started!");
    console.log(`🔹 ID: ${id}`);
    console.log(`🔹 Status: ${status}`);
    console.log(`🔹 Trigger: ${trigger}`);
    
    if (commit) {
      console.log(`📝 Commit: ${commit.message}`);
    }
    
    console.log(`🔗 Dashboard: https://dashboard.render.com/web/${serviceId}/deploys/${id}`);

  } catch (err) {
    console.error(
      "❌ [Render Engine]: Deploy Failed ->",
      err.response?.data?.message || err.message
    );
  }
}

module.exports = deployLatestCommit;
