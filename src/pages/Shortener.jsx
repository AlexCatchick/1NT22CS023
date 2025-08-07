import React, { useState, useEffect } from "react";
import { Log } from "../utils/logger";
import "../styles/style.css";
const Shortener = () => {
  const [urls, setUrls] = useState([
    { id: 1, url: "", validity: 30, customCode: "", loading: false, error: "" },
  ]);
  const [shortenedUrls, setShortenedUrls] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  // Load saved URLs from localStorage on component mount
  useEffect(() => {
    const savedUrls = localStorage.getItem("shortenedUrls");
    if (savedUrls) {
      setShortenedUrls(JSON.parse(savedUrls));
      Log("frontend", "info", "Loaded saved URLs from localStorage", "page");
    }
  }, []);
  // Save URLs to localStorage whenever shortenedUrls changes
  useEffect(() => {
    if (shortenedUrls.length > 0) {
      localStorage.setItem("shortenedUrls", JSON.stringify(shortenedUrls));
    }
  }, [shortenedUrls]);
  const addUrlInput = () => {
    if (urls.length < 5) {
      const newUrl = {
        id: Date.now(),
        url: "",
        validity: 30,
        customCode: "",
        loading: false,
        error: "",
      };
      setUrls([...urls, newUrl]);
      Log("frontend", "info", `Added new URL input. Total: ${urls.length + 1}`, "component");
    }
  };

  const removeUrlInput = (id) => {
    if (urls.length > 1) {
      setUrls(urls.filter((url) => url.id !== id));
      Log("frontend", "info", `Removed URL input. Remaining: ${urls.length - 1}`, "component");
    }
  };

  const updateUrlInput = (id, field, value) => {
    setUrls(
      urls.map((url) =>
        url.id === id ? { ...url, [field]: value, error: "" } : url
      )
    );
  };

  const validateUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateValidity = (validity) => {
    const num = parseInt(validity);
    return !isNaN(num) && num > 0 && num <= 525600; // Max 1 year in minutes
  };

  const validateCustomCode = (code) => {
    if (!code) return true; // Optional field
    return /^[a-zA-Z0-9-_]+$/.test(code) && code.length >= 3 && code.length <= 20;
  };

  const generateShortCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const isShortCodeUnique = (code) => {
    return !shortenedUrls.some((url) => url.shortCode === code);
  };

  const shortenUrl = async (urlData) => {
    Log("frontend", "info", `Attempting to shorten URL: ${urlData.url}`, "api");

    // Client-side validation
    if (!validateUrl(urlData.url)) {
      Log("frontend", "warn", "Invalid URL format provided", "component");
      return { success: false, error: "Invalid URL format" };
    }

    if (!validateValidity(urlData.validity)) {
      Log("frontend", "warn", "Invalid validity period provided", "component");
      return { success: false, error: "Validity must be between 1 and 525,600 minutes" };
    }

    if (urlData.customCode && !validateCustomCode(urlData.customCode)) {
      Log("frontend", "warn", "Invalid custom code format", "component");
      return { success: false, error: "Custom code must be 3-20 characters (alphanumeric, hyphens, underscores only)" };
    }

    // Handle custom code uniqueness
    let shortCode = urlData.customCode;
    if (shortCode) {
      if (!isShortCodeUnique(shortCode)) {
        Log("frontend", "warn", "Custom code already exists", "component");
        return { success: false, error: "Custom code is already in use" };
      }
    } else {
      // Generate unique short code
      do {
        shortCode = generateShortCode();
      } while (!isShortCodeUnique(shortCode));
    }

    const shortenedUrl = `http://localhost:5174/s/${shortCode}`;
    const expiryDate = new Date(Date.now() + urlData.validity * 60 * 1000);

    const newShortenedUrl = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      originalUrl: urlData.url,
      shortenedUrl: shortenedUrl,
      shortCode: shortCode,
      validity: urlData.validity,
      createdAt: new Date().toISOString(),
      expiresAt: expiryDate.toISOString(),
      clicks: 0,
      isActive: true,
    };

    Log("frontend", "info", `URL shortened successfully: ${urlData.url} -> ${shortenedUrl}`, "api");
    return { success: true, data: newShortenedUrl };
  };

  const handleShortenAll = async () => {
    Log("frontend", "info", "Starting bulk URL shortening process", "page");

    // Filter valid inputs
    const validUrls = urls.filter((url) => url.url.trim() !== "");

    if (validUrls.length === 0) {
      Log("frontend", "warn", "No URLs provided for shortening", "component");
      setSuccessMessage("");
      return;
    }

    // Set loading state for valid URLs
    setUrls(
      urls.map((url) =>
        validUrls.find((valid) => valid.id === url.id)
          ? { ...url, loading: true, error: "" }
          : url
      )
    );

    try {
      // Process all URLs concurrently
      const results = await Promise.all(
        validUrls.map(async (url) => {
          try {
            const result = await shortenUrl(url);
            return { id: url.id, result };
          } catch (error) {
            Log("frontend", "error", `Error shortening URL: ${error.message}`, "api");
            return { id: url.id, result: { success: false, error: error.message } };
          }
        })
      );

      // Update UI with results
      let successCount = 0;
      const newShortenedUrls = [];

      setUrls(
        urls.map((url) => {
          const result = results.find((r) => r.id === url.id);
          if (result) {
            if (result.result.success) {
              successCount++;
              newShortenedUrls.push(result.result.data);
              return { ...url, loading: false, url: "", customCode: "", error: "" };
            } else {
              return { ...url, loading: false, error: result.result.error };
            }
          }
          return url;
        })
      );

      // Add new shortened URLs to the list
      if (newShortenedUrls.length > 0) {
        setShortenedUrls((prev) => [...prev, ...newShortenedUrls]);
        setSuccessMessage(`Successfully shortened ${successCount} URL(s)`);

        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(""), 5000);
      }

      Log("frontend", "info", `Bulk shortening completed. Success: ${successCount}/${validUrls.length}`, "page");
    } catch (error) {
      Log("frontend", "error", `Error in bulk URL shortening: ${error.message}`, "page");

      // Reset loading states
      setUrls(urls.map((url) => ({ ...url, loading: false })));
    }
  };

  const deleteUrl = (urlId) => {
    const updatedUrls = shortenedUrls.filter((url) => url.id !== urlId);
    setShortenedUrls(updatedUrls);
    localStorage.setItem("shortenedUrls", JSON.stringify(updatedUrls));
    Log("frontend", "info", `Deleted URL with ID: ${urlId}`, "component");
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      Log("frontend", "info", "URL copied to clipboard", "component");
    } catch (error) {
      Log("frontend", "warn", "Failed to copy URL to clipboard", "component");
    }
  };

  const handleRedirect = (url) => {
    // Check if URL is expired
    if (isExpired(url.expiresAt)) {
      alert("This URL has expired and cannot be accessed.");
      Log("frontend", "warn", `Attempted to access expired URL: ${url.shortCode}`, "page");
      return;
    }

    Log("frontend", "info", `Redirecting to: ${url.originalUrl}`, "page");

    // Get user's approximate location (simulated for demo)
    const locations = [
      "New York, USA",
      "London, UK",
      "Tokyo, Japan",
      "Sydney, Australia",
      "Toronto, Canada",
      "Berlin, Germany",
      "Mumbai, India",
      "São Paulo, Brazil"
    ];

    const randomLocation = locations[Math.floor(Math.random() * locations.length)];

    // Create click tracking data
    const clickData = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      urlId: url.id,
      timestamp: new Date().toISOString(),
      location: randomLocation,
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // Simulated IP
      userAgent: navigator.userAgent.substring(0, 50) + "...", // Truncated user agent
      originalUrl: url.originalUrl,
    };

    // Save click data
    const existingClickData = JSON.parse(localStorage.getItem("urlClickData") || "[]");
    const updatedClickData = [...existingClickData, clickData];
    localStorage.setItem("urlClickData", JSON.stringify(updatedClickData));

    // Increment click count
    const updatedUrls = shortenedUrls.map((u) =>
      u.id === url.id ? { ...u, clicks: u.clicks + 1 } : u
    );
    setShortenedUrls(updatedUrls);
    localStorage.setItem("shortenedUrls", JSON.stringify(updatedUrls));

    Log("frontend", "info", `Click tracked from ${randomLocation} for URL: ${url.shortCode}`, "component");

    // Ensure the original URL has a protocol
    let targetUrl = url.originalUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    // Open original URL in new tab
    try {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      // Fallback: try direct assignment
      console.warn("Popup blocked, trying direct navigation");
      window.location.href = targetUrl;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt) => {
    return new Date() > new Date(expiresAt);
  };

  return (
    <div className="container">
      <h1>URL Shortener</h1>
      <p>Shorten up to 5 URLs concurrently with custom codes and validity periods</p>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {/* URL Input Section */}
      <div className="url-inputs">
        <h2>Add URLs to Shorten ({urls.length}/5)</h2>

        {urls.map((url, index) => (
          <div key={url.id} className="url-input-group">
            <div className="input-row">
              <div className="input-field">
                <label>URL {index + 1}:</label>
                <input
                  type="text"
                  value={url.url}
                  onChange={(e) => updateUrlInput(url.id, "url", e.target.value)}
                  placeholder="https://example.com"
                  disabled={url.loading}
                />
              </div>

              <div className="input-field">
                <label>Validity (minutes):</label>
                <input
                  type="number"
                  value={url.validity}
                  onChange={(e) => updateUrlInput(url.id, "validity", e.target.value)}
                  min="1"
                  max="525600"
                  disabled={url.loading}
                />
              </div>

              <div className="input-field">
                <label>Custom Code (optional):</label>
                <input
                  type="text"
                  value={url.customCode}
                  onChange={(e) => updateUrlInput(url.id, "customCode", e.target.value)}
                  placeholder="my-link"
                  disabled={url.loading}
                />
              </div>

              <button
                onClick={() => removeUrlInput(url.id)}
                disabled={urls.length === 1 || url.loading}
                className="remove-btn"
              >
                {url.loading ? "⏳" : "❌"}
              </button>
            </div>

            {url.error && (
              <div className="error-message">
                {url.error}
              </div>
            )}
          </div>
        ))}

        <div className="action-buttons">
          <button
            onClick={addUrlInput}
            disabled={urls.length >= 5}
            className="add-btn"
          >
            Add URL ({urls.length}/5)
          </button>

          <button
            onClick={handleShortenAll}
            disabled={urls.every((url) => url.loading || !url.url.trim())}
            className="shorten-btn"
          >
            Shorten All URLs
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="statistics">
        <h2>Statistics</h2>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-number">{shortenedUrls.length}</span>
            <span className="stat-label">Total URLs</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{shortenedUrls.reduce((sum, url) => sum + url.clicks, 0)}</span>
            <span className="stat-label">Total Clicks</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{shortenedUrls.filter(url => !isExpired(url.expiresAt)).length}</span>
            <span className="stat-label">Active URLs</span>
          </div>
        </div>
      </div>

      {/* Shortened URLs List */}
      <div className="shortened-urls">
        <h2>Your Shortened URLs</h2>

        {shortenedUrls.length === 0 ? (
          <p className="no-urls">No shortened URLs yet. Create your first one above!</p>
        ) : (
          <div className="urls-list">
            {shortenedUrls
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((url) => (
                <div key={url.id} className={`url-card ${isExpired(url.expiresAt) ? 'expired' : 'active'}`}>
                  <div className="url-header">
                    <div className="url-info">
                      <span className="short-url">{url.shortenedUrl}</span>
                      <span className={`status ${isExpired(url.expiresAt) ? 'expired' : 'active'}`}>
                        {isExpired(url.expiresAt) ? 'Expired' : 'Active'}
                      </span>
                      <span className="clicks">{url.clicks} clicks</span>
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
                        onClick={() => handleRedirect(url)}
                        className="action-btn redirect-btn"
                        title="Open original URL"
                      >
                        🔗
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

                  <div className="url-details">
                    <p><strong>Original:</strong> <a href={url.originalUrl} target="_blank" rel="noopener noreferrer">{url.originalUrl}</a></p>
                    <p><strong>Created:</strong> {formatDate(url.createdAt)}</p>
                    <p><strong>Expires:</strong> {formatDate(url.expiresAt)}</p>
                    <p><strong>Validity:</strong> {url.validity} minutes</p>
                    <p><strong>Short Code:</strong> {url.shortCode}</p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Shortener;
