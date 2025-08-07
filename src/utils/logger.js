const LOG_ENDPOINT = "http://20.244.56.144/evaluation-service/logs";
const allowedStacks = ["frontend", "backend"];
const allowedLevels = ["debug", "info", "warn", "error", "fatal"];
const allowedPackages = [
    "api", "component", "hook", "page", "state",
    "style", "auth", "config", "middleware", "utils"
];
export async function Log(stack, level, message, pkg) {
    const formattedStack = stack.toLowerCase();
    const formattedLevel = level.toLowerCase();
    const formattedPackages = pkg.toLowerCase();
    const formattedMessage = message.trim();

    if (!allowedStacks.includes(formattedStack)) {
        console.warn(`[Logger] Invalid stack: ${stack}`);
        return;
    }

    if (!allowedLevels.includes(formattedLevel)) {
        console.warn(`[Logger] Invalid level: ${level}`);
        return;
    }

    if (!allowedPackages.includes(formattedPackages)) {
        console.warn(`[Logger] Invalid package: ${pkg}`);
        return;
    }

    const payload = {
        stack: formattedStack,
        level: formattedLevel,
        message: formattedMessage,
        package: formattedPackages,
    };

    try {
        const res = await fetch(LOG_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok) {
            console.log(`[Logger] Success: ${data.logID}`);
        } else {
            console.error(`[Logger] Server Error: ${data.message}`);
        }
    } catch (err) {
        console.error(`[Logger] Request Failed: ${err.message}`);
    }
}
