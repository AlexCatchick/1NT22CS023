import React, { useState, useEffect } from "react";
import { Log } from "../utils/logger";
import "../styles/style.css";

const Statistics = () => {
    const [shortenedUrls, setShortenedUrls] = useState([]);
    const [selectedUrl, setSelectedUrl] = useState(null);
    const [clickData, setClickData] = useState([]);

    // Load saved URLs from localStorage on component mount
    useEffect(() => {
        loadStatisticsData();
    }, []);

    const loadStatisticsData = () => {
        try {
            Log("frontend", "info", "Loading statistics data", "page");

            const savedUrls = localStorage.getItem("shortenedUrls");
            const savedClicks = localStorage.getItem("urlClickData");

            if (savedUrls) {
                setShortenedUrls(JSON.parse(savedUrls));
            }

            if (savedClicks) {
                setClickData(JSON.parse(savedClicks));
            }

            Log("frontend", "info", "Statistics data loaded successfully", "page");
        } catch (error) {
            Log("frontend", "error", `Error loading statistics data: ${error.message}`, "page");
        }
    };

    // Simulate click tracking for demonstration purposes
    const simulateClick = (urlId) => {
        try {
            Log("frontend", "info", `Simulating click for URL: ${urlId}`, "component");

            // Get user's approximate location (simulated for demo)
            const locations = [
                "Pune, India",
                "Mumbai, India",
                "Jhansi, India",
                "Bengaluru, India"
            ];

            const randomLocation = locations[Math.floor(Math.random() * locations.length)];

            const newClick = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                urlId: urlId,
                timestamp: new Date().toISOString(),
                location: randomLocation,
                ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // Simulated IP
                userAgent: navigator.userAgent.substring(0, 50) + "...", // Truncated user agent
            };

            // Update click data
            const updatedClickData = [...clickData, newClick];
            setClickData(updatedClickData);
            localStorage.setItem("urlClickData", JSON.stringify(updatedClickData));

            // Update URL click count
            const updatedUrls = shortenedUrls.map((url) =>
                url.id === urlId ? { ...url, clicks: url.clicks + 1 } : url
            );
            setShortenedUrls(updatedUrls);
            localStorage.setItem("shortenedUrls", JSON.stringify(updatedUrls));

            Log("frontend", "info", `Click recorded for URL: ${urlId} from ${randomLocation}`, "component");
        } catch (error) {
            Log("frontend", "error", `Error recording click: ${error.message}`, "component");
        }
    };

    const getClicksForUrl = (urlId) => {
        return clickData.filter((click) => click.urlId === urlId);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            full: date.toLocaleString(),
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString()
        };
    };

    const isExpired = (expiresAt) => {
        return new Date() > new Date(expiresAt);
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            Log("frontend", "info", "URL copied to clipboard", "component");
            alert("URL copied to clipboard!");
        } catch (error) {
            Log("frontend", "warn", "Failed to copy URL to clipboard", "component");
        }
    };

    const deleteUrl = (urlId) => {
        try {
            Log("frontend", "info", `Deleting URL with ID: ${urlId}`, "component");

            // Remove URL from shortened URLs
            const updatedUrls = shortenedUrls.filter((url) => url.id !== urlId);
            setShortenedUrls(updatedUrls);
            localStorage.setItem("shortenedUrls", JSON.stringify(updatedUrls));

            // Remove associated click data
            const updatedClickData = clickData.filter((click) => click.urlId !== urlId);
            setClickData(updatedClickData);
            localStorage.setItem("urlClickData", JSON.stringify(updatedClickData));

            // Clear selected URL if it was deleted
            if (selectedUrl && selectedUrl.id === urlId) {
                setSelectedUrl(null);
            }

            Log("frontend", "info", `URL and associated click data deleted: ${urlId}`, "component");
        } catch (error) {
            Log("frontend", "error", `Error deleting URL: ${error.message}`, "component");
        }
    };

    const getTotalClicks = () => {
        return shortenedUrls.reduce((sum, url) => sum + url.clicks, 0);
    };

    const getActiveUrls = () => {
        return shortenedUrls.filter((url) => !isExpired(url.expiresAt)).length;
    };

    const getMostClickedUrl = () => {
        if (shortenedUrls.length === 0) return null;
        return shortenedUrls.reduce((max, url) => (url.clicks > max.clicks ? url : max));
    };

    const getRecentClicks = () => {
        return clickData
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 10);
    };

    const getLocationStats = () => {
        const locationCounts = {};
        clickData.forEach((click) => {
            locationCounts[click.location] = (locationCounts[click.location] || 0) + 1;
        });

        return Object.entries(locationCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5);
    };

    return (
        <div className="container">
            <h1>URL Statistics & Analytics</h1>
            <div className="statistics">
                <h2>Overall Statistics</h2>
                <div className="stats-grid">
                    <div className="stat-item">
                        <span className="stat-number">{shortenedUrls.length}</span>
                        <span className="stat-label">Total URLs</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{getTotalClicks()}</span>
                        <span className="stat-label">Total Clicks</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{getActiveUrls()}</span>
                        <span className="stat-label">Active URLs</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{clickData.length}</span>
                        <span className="stat-label">Click Events</span>
                    </div>
                </div>
            </div>
            {getLocationStats().length > 0 && (
                <div className="location-stats">
                    <h2>Top Locations</h2>
                    <div className="location-list">
                        {getLocationStats().map(([location, count]) => (
                            <div key={location} className="location-item">
                                <span className="location-name">{location}</span>
                                <span className="location-count">{count} clicks</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <div className="url-statistics">
                <h2>Detailed URL Statistics</h2>

                {shortenedUrls.length === 0 ? (
                    <p className="no-urls">No URLs found. Create your first shortened URL!</p>
                ) : (
                    <div className="urls-stats-list">
                        {shortenedUrls
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .map((url) => {
                                const urlClicks = getClicksForUrl(url.id);
                                const createdDate = formatDate(url.createdAt);
                                const expiryDate = formatDate(url.expiresAt);
                                const expired = isExpired(url.expiresAt);

                                return (
                                    <div key={url.id} className={`url-stats-card ${expired ? 'expired' : 'active'}`}>
                                        {/* URL Header */}
                                        <div className="url-stats-header">
                                            <div className="url-main-info">
                                                <h3 className="short-url">{url.shortenedUrl}</h3>
                                                <div className="url-meta">
                                                    <span className={`status ${expired ? 'expired' : 'active'}`}>
                                                        {expired ? 'Expired' : 'Active'}
                                                    </span>
                                                    <span className="clicks-badge">{url.clicks} clicks</span>
                                                    <span className="short-code">Code: {url.shortCode}</span>
                                                </div>
                                            </div>
                                            <div className="url-actions">
                                                <button
                                                    onClick={() => copyToClipboard(url.shortenedUrl)}
                                                    className="action-btn copy-btn"
                                                    title="Copy short URL"
                                                >
                                                    📋
                                                </button>
                                                <button
                                                    onClick={() => simulateClick(url.id)}
                                                    className="action-btn simulate-btn"
                                                    title="Simulate click"
                                                    disabled={expired}
                                                >
                                                    👆
                                                </button>
                                                <button
                                                    onClick={() => deleteUrl(url.id)}
                                                    className="action-btn delete-btn"
                                                    title="Delete URL"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>

                                        <div className="url-details-section">
                                            <div className="url-basic-info">
                                                <p><strong>Original URL:</strong>
                                                    <a href={url.originalUrl} target="_blank" rel="noopener noreferrer">
                                                        {url.originalUrl}
                                                    </a>
                                                </p>
                                                <div className="date-info">
                                                    <div className="date-item">
                                                        <strong>Created:</strong> {createdDate.full}
                                                    </div>
                                                    <div className="date-item">
                                                        <strong>Expires:</strong> {expiryDate.full}
                                                    </div>
                                                    <div className="date-item">
                                                        <strong>Validity:</strong> {url.validity} minutes
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="click-statistics">
                                                <h4>Click Analytics ({urlClicks.length} total clicks)</h4>

                                                {urlClicks.length === 0 ? (
                                                    <p className="no-clicks">No clicks recorded yet.</p>
                                                ) : (
                                                    <div className="clicks-data">
                                                        {/* Click Summary */}
                                                        <div className="click-summary">
                                                            <div className="summary-item">
                                                                <span className="summary-label">Total Clicks:</span>
                                                                <span className="summary-value">{urlClicks.length}</span>
                                                            </div>
                                                            <div className="summary-item">
                                                                <span className="summary-label">Latest Click:</span>
                                                                <span className="summary-value">
                                                                    {formatDate(urlClicks[0]?.timestamp || url.createdAt).full}
                                                                </span>
                                                            </div>
                                                            <div className="summary-item">
                                                                <span className="summary-label">Unique Locations:</span>
                                                                <span className="summary-value">
                                                                    {[...new Set(urlClicks.map(click => click.location))].length}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="detailed-clicks">
                                                            <h5>Detailed Click Data:</h5>
                                                            <div className="clicks-table">
                                                                <div className="clicks-header">
                                                                    <span>Timestamp</span>
                                                                    <span>Location</span>
                                                                    <span>IP Address</span>
                                                                </div>
                                                                {urlClicks
                                                                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                                                                    .map((click) => {
                                                                        const clickDate = formatDate(click.timestamp);
                                                                        return (
                                                                            <div key={click.id} className="click-row">
                                                                                <span className="click-timestamp">
                                                                                    <div className="timestamp-date">{clickDate.date}</div>
                                                                                    <div className="timestamp-time">{clickDate.time}</div>
                                                                                </span>
                                                                                <span className="click-location">{click.location}</span>
                                                                                <span className="click-ip">{click.ip}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                            </div>
                                                        </div>

                                                        {/* Location Distribution for this URL */}
                                                        <div className="url-locations">
                                                            <h5>Geographic Distribution:</h5>
                                                            <div className="location-distribution">
                                                                {[...new Set(urlClicks.map(click => click.location))].map(location => {
                                                                    const locationCount = urlClicks.filter(click => click.location === location).length;
                                                                    const percentage = ((locationCount / urlClicks.length) * 100).toFixed(1);

                                                                    return (
                                                                        <div key={location} className="location-bar">
                                                                            <div className="location-info">
                                                                                <span className="location-name">{location}</span>
                                                                                <span className="location-stats">{locationCount} clicks ({percentage}%)</span>
                                                                            </div>
                                                                            <div className="location-progress">
                                                                                <div
                                                                                    className="location-progress-bar"
                                                                                    style={{ width: `${percentage}%` }}
                                                                                ></div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            {getRecentClicks().length > 0 && (
                <div className="recent-activity">
                    <h2>Recent Click Activity</h2>
                    <div className="recent-clicks">
                        {getRecentClicks().map((click) => {
                            const url = shortenedUrls.find(u => u.id === click.urlId);
                            const clickDate = formatDate(click.timestamp);

                            return (
                                <div key={click.id} className="recent-click-item">
                                    <div className="recent-click-info">
                                        <span className="recent-url">{url?.shortCode || 'Unknown'}</span>
                                        <span className="recent-location">{click.location}</span>
                                    </div>
                                    <div className="recent-timestamp">
                                        <div>{clickDate.date}</div>
                                        <div>{clickDate.time}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Statistics;
