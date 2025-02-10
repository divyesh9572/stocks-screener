const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;  

app.use(cors({
  origin: "*", // Allows requests from any origin
  methods: ["GET", "POST"], // Allow specific HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const axiosInstance = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.nseindia.com/",
  },
  timeout: 10000, // 10 seconds timeout
});

const NSE_BHAVCOPY_URL = "https://www.nseindia.com/api/reports";
const NSE_UNDERLYING_URL =
  "https://www.nseindia.com/api/underlying-information";

// ** Function to get NSE session cookies **

const getNseCookies = async () => {
  try {
    const response = await axios.get("https://www.nseindia.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    return response.headers["set-cookie"];
  } catch (error) {
    console.error("Error fetching NSE cookies:", error.message);
    return null;
  }
};


// ** Function to fetch Bhavcopy data for a given date **
const fetchBhavcopyData = async (date, cookies) => {
  try {
    const queryParams = {
      archives: JSON.stringify([
        {
          name: "Full Bhavcopy and Security Deliverable data",
          type: "daily-reports",
          category: "capital-market",
          section: "equities",
        },
      ]),
      date,
      type: "equities",
      mode: "single",
    };

    const response = await axiosInstance.get(NSE_BHAVCOPY_URL, {
      params: queryParams,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://www.nseindia.com/",
        Cookie: cookies.join("; "),
      },
    });

    return parseCSV(response.data);
  } catch (error) {
    console.error(`Error fetching Bhavcopy data for ${date}:`, error.message);
    return [];
  }
};
const fetchSectorcopyData = async (date, cookies) => {
  try {
    // Convert date "31-Dec-2024" to "MA311224.csv"
    const months = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };

    const [day, monthStr, year] = date.split("-");
    const month = months[monthStr]; // Convert "Dec" to "12"
    const shortYear = year.slice(-2); // Convert "2024" to "24"

    const fileName = `MA${day}${month}${shortYear}.csv`;

    // Construct the dynamic URL
    const NSE_SECTORCOPY_URL = `https://nsearchives.nseindia.com/archives/equities/mkt/${fileName}`;
    const response = await axiosInstance.get(NSE_SECTORCOPY_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://www.nseindia.com/",
        Cookie: cookies.join("; "),
      },
    });

    // return response.data;
    return parseCSV1(response.data);
  } catch (error) {
    console.error(`Error fetching Sectorcopy data for ${date}:`, error.message);
    return [];
  }
};
const fetchNifty500Data = async (cookies) => {
  try {
    const NIFTY500_URL =
      "https://nsearchives.nseindia.com/content/indices/ind_nifty500list.csv";
    const response = await axiosInstance.get(NIFTY500_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://www.nseindia.com/",
        Cookie: cookies.join("; "),
      },
    });

    return parseCSV2(response.data);
  } catch (error) {
    console.error(`Error fetching NIFTY 500 data:`, error.message);
    return [];
  }
};

const parseCSV2 = (csvData) => {
  const lines = csvData.trim().split("\n");
  if (lines.length < 2) {
    console.error("Invalid CSV format: No data found.");
    return [];
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const dataLines = lines.slice(1); // Skip the header line

  return dataLines.map((line) => {
    const values = line.split(",").map((v) => v.trim());
    let obj = {};

    headers.forEach((header, index) => {
      if (header === "Industry" || header === "Symbol") {
        obj[header] = values[index] || null;
      }
    });

    return obj;
  });
};

let niftyIndices = new Set([
  "Nifty 50",
  "Nifty IT",
  "Nifty Bank",
  "Nifty Realty",
  "Nifty Infra",
  "Nifty Energy",
  "Nifty FMCG",
  "Nifty MNC",
  "Nifty Pharma",
  "Nifty PSE",
  "Nifty PSU Bank",
  "Nifty Auto",
  "Nifty Metal",
  "Nifty Media",
  "Nifty Commodities",
  "Nifty Consumption",
  "Nifty Fin Service",
  "Nifty CPSE",
  "NIFTY HEALTHCARE",
  "NIFTY CONSR DURBL",
  "NIFTY OIL AND GAS",
]);

const parseCSV1 = (csvData) => {
  const lines = csvData.trim().split("\n");

  // Find the start of the index table
  let startIndex = lines.findIndex((line) => line.startsWith(",INDEX,"));

  if (startIndex === -1) {
    console.error("Invalid CSV format: No index table found.");
    return [];
  }

  const headers = lines[startIndex].split(",").map((h) => h.trim());
  const dataLines = lines.slice(startIndex + 1); // Skip header line

  return dataLines.map((line) => {
    const values = line.split(",").map((v) => v.trim());
    let obj = {};

    headers.forEach((header, index) => {
      obj[header] = values[index] || null;
    });

    // Convert relevant fields to numbers
    ["PREVIOUS CLOSE", "OPEN", "HIGH", "LOW", "CLOSE", "GAIN/LOSS"].forEach(
      (key) => {
        if (obj[key]) {
          obj[key] = parseFloat(obj[key].replace(/,/g, "")) || 0;
          delete obj[""];
        }
      }
    );
    return obj;
  });
};

// ** Function to fetch NSE Underlying Information and extract symbols **
const getNseUnderlyingSymbols = async (cookies) => {
  try {
    const response = await axiosInstance.get(NSE_UNDERLYING_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: "https://www.nseindia.com/",
        Cookie: cookies.join("; "),
      },
    });

    const data = response.data?.data;
    if (!data) {
      return new Set();
    }

    const symbols = new Set([
      ...data.IndexList.map((item) => item.symbol),
      ...data.UnderlyingList.map((item) => item.symbol),
    ]);

    return symbols;
  } catch (error) {
    console.error("Error fetching underlying information:", error.message);
    return new Set();
  }
};

// ** Function to parse CSV into JSON **
const parseCSV = (csvData) => {
  const lines = csvData.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    let obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || null;
    });

    // Convert numerical values to numbers
    obj.TTL_TRD_QNTY = obj.TTL_TRD_QNTY
      ? parseInt(obj.TTL_TRD_QNTY.replace(/,/g, ""), 10)
      : 0;
    obj.DELIV_QTY = obj.DELIV_QTY
      ? parseInt(obj.DELIV_QTY.replace(/,/g, ""), 10)
      : 0;

    return obj;
  });
};

// ** API Route to fetch, compare Bhavcopy Data, and apply NSE Underlying Information filter **
app.get("/nse-bhavcopy", async (req, res) => {
  try {
    const { date, value, filter } = req.query;
    const numericValue = Number(value);
    if (!date) {
      return res.status(400).json({
        error:
          "At least one date parameter is required in format DD-MMM-YYYY. Example: date=04-Feb-2025,05-Feb-2025",
      });
    }

    // Convert date string into an array of dates
    const dates = date.split(",").map((d) => d.trim());

    if (dates.length < 2) {
      return res
        .status(400)
        .json({ error: "At least two dates are required for comparison" });
    }

    const cookies = await getNseCookies();
    console.log(cookies);
    
    if (!cookies) {
      return res
        .status(500)
        .json({ error: "Failed to fetch NSE session cookies" });
    }
    // Get NSE session cookies
    const data = await fetchNifty500Data(cookies);
    const industryMap = data.reduce((acc, item) => {
      acc[item.Symbol] = item.Industry;
      return acc;
    }, {});
    

    // Fetch NSE Underlying Symbols
    const validSymbols = await getNseUnderlyingSymbols(cookies);
    if (!validSymbols || validSymbols.size === 0) {
      return res
        .status(500)
        .json({ error: "Failed to fetch NSE underlying symbols" });
    }

    // Fetch Bhavcopy Data for each date
    const bhavcopyData = {};
    for (let d of dates) {
      bhavcopyData[d] = await fetchBhavcopyData(d, cookies);
    }

    // Compare data between the latest two dates
    const [earlierDate, laterDate] = dates.slice(-2); // Get the last two dates
    const earlierData = bhavcopyData[earlierDate] || [];
    const laterData = bhavcopyData[laterDate] || [];

    // Create a map for earlier date data
    const earlierMap = {};
    earlierData.forEach((item) => {
      earlierMap[item.SYMBOL] = item;
    });
    // Filter laterData where TTL_TRD_QNTY and DELIV_QTY increased, and symbol is in NSE Underlying List
    const filteredData = laterData.filter((item) => {
      const earlierEntry = earlierMap[item.SYMBOL];
      if (!earlierEntry) return false;
      if (numericValue == 0) {
        return (
          validSymbols.has(item.SYMBOL) &&
          !(item.TTL_TRD_QNTY > earlierEntry.TTL_TRD_QNTY) &&
          !(item.DELIV_QTY > earlierEntry.DELIV_QTY)
        );
      } else if (numericValue == 1) {
        return (
          (validSymbols.has(item.SYMBOL) &&
            item.TTL_TRD_QNTY > earlierEntry.TTL_TRD_QNTY) ||
          item.DELIV_QTY > earlierEntry.DELIV_QTY
        );
      } else if (numericValue == 2) {
        return (
          validSymbols.has(item.SYMBOL) &&
          item.TTL_TRD_QNTY > earlierEntry.TTL_TRD_QNTY &&
          item.DELIV_QTY > earlierEntry.DELIV_QTY
        );
      }
    });

    const finaldata = [];
    filteredData.map((data) => {
      const earlierEntry = earlierMap[data.SYMBOL]; // Get earlier date data
      let obj = {
        SYMBOL: data["SYMBOL"],
        DELIV_QTY_TODAY: data["DELIV_QTY"],
        DELIV_PER_TODAY: data["DELIV_PER"], // Current date DELIV_PER
        DELIV_QTY_YESTERDAY: earlierEntry ? earlierEntry["DELIV_QTY"] : null, // Earlier date DELIV_PER
      };
      if (numericValue == 2) {
        if (obj.DELIV_PER_TODAY > filter) {
          const industry = industryMap[obj.SYMBOL];
          let symbolsList = [];
          for (let [key, value] of Object.entries(industryMap)) {
            if (value === industry && validSymbols.has(key)) {
              symbolsList.push(key);
            }
          }
          let fSet = new Set(symbolsList);
          let sumearlierData = 0;
          let sumlaterData = 0;
          earlierData.forEach((val) => {
            if (fSet.has(val.SYMBOL)) {
              sumearlierData += val.DELIV_QTY;
            }
          });
          laterData.forEach((val) => {
            if (fSet.has(val.SYMBOL)) {
              sumlaterData += val.DELIV_QTY;
            }
          });
          if (sumearlierData >= sumlaterData) {
            obj["SEC_BREAKOUT"] = "Yes";
          } else {
            obj["SEC_BREAKOUT"] = "No";
          }
          finaldata.push(obj);
        }
      } else {
        if (validSymbols.has(obj.SYMBOL)) {
          finaldata.push(obj);
        }
      }
    });
    res.json(finaldata);
  } catch (error) {
    console.error("Error processing Bhavcopy comparison:", error);
    res.status(500).json({
      error: "Failed to fetch and compare Bhavcopy data",
      details: error.message,
    });
  }
});
app.get("/top-gainer-daily", async (req, res) => {
  try {
    const { date, order, value } = req.query;
    const numericValue = Number(value);

    if (!date) {
      return res.status(400).json({
        error:
          "At least one date parameter is required in format DD-MMM-YYYY. Example: date=04-Feb-2025,05-Feb-2025",
      });
    }

    // Convert date string into an array of dates
    const dates = date.split(",").map((d) => d.trim());

    if (dates.length < 2) {
      return res
        .status(400)
        .json({ error: "At least two dates are required for comparison" });
    }

    // Get NSE session cookies
    const cookies = await getNseCookies();
    if (!cookies) {
      return res
        .status(500)
        .json({ error: "Failed to fetch NSE session cookies" });
    }

    // Fetch NSE Underlying Symbols
    const validSymbols = await getNseUnderlyingSymbols(cookies);
    if (!validSymbols || validSymbols.size === 0) {
      return res
        .status(500)
        .json({ error: "Failed to fetch NSE underlying symbols" });
    }

    // Fetch Bhavcopy Data for each date
    const bhavcopyData = {};
    for (let d of dates) {
      bhavcopyData[d] = await fetchBhavcopyData(d, cookies);
    }

    // Compare data between the latest two dates
    const [earlierDate, laterDate] = dates.slice(-2); // Get the last two dates
    const earlierData = bhavcopyData[earlierDate] || [];
    const laterData = bhavcopyData[laterDate] || [];

    // Create a map for earlier date data
    const earlierMap = {};
    earlierData.forEach((item) => {
      earlierMap[item.SYMBOL] = item;
    });

    // Filter laterData where LAST_PRICE increased compared to earlier LAST_PRICE
    const filteredData = laterData.filter((item) => {
      const earlierEntry = earlierMap[item.SYMBOL];
      if (!earlierEntry) return false;

      return (
        validSymbols.has(item.SYMBOL) &&
        item.LAST_PRICE > earlierEntry.LAST_PRICE
      );
    });

    // Build response data with additional calculations
    const finaldata = filteredData.map((data) => {
      const earlierEntry = earlierMap[data.SYMBOL]; // Get the earlier entry
      const lastPriceEarlier = earlierEntry ? earlierEntry["LAST_PRICE"] : null;
      const lastPriceLater = data["LAST_PRICE"];

      // Calculate Log Return: LN(C2/B2)
      const logReturn =
        lastPriceEarlier && lastPriceLater
          ? Math.log(lastPriceLater / lastPriceEarlier)
          : null;

      // Calculate Percentage Change: ((C2 - B2) / B2) * 100
      const percentageChange =
        lastPriceEarlier && lastPriceLater
          ? ((lastPriceLater - lastPriceEarlier) / lastPriceEarlier) * 100
          : null;

      return {
        SYMBOL: data["SYMBOL"],
        // EARLIER_DATE: earlierDate, // Add the earlier date for reference
        // LATER_DATE: laterDate, // Add the later date for reference
        LAST_PRICE_EARLIER_DATE: lastPriceEarlier, // Earlier Date's LAST_PRICE
        LAST_PRICE_LATER_DATE: lastPriceLater, // Current Date's LAST_PRICE
        // LOG_RETURN: logReturn ? logReturn.toFixed(6) : null, // Natural log return LN(C2/B2)
        PERCENTAGE_CHANGE: percentageChange
          ? percentageChange.toFixed(2) + "%"
          : null, // Percentage change
      };
    });

    if (order == "desc") {
      finaldata.sort((a, b) => {
        return (
          parseFloat(b.PERCENTAGE_CHANGE) - parseFloat(a.PERCENTAGE_CHANGE)
        );
      });
    } else {
      finaldata.sort((a, b) => {
        return (
          parseFloat(a.PERCENTAGE_CHANGE) - parseFloat(b.PERCENTAGE_CHANGE)
        );
      });
    }

    const fData = finaldata.slice(0, numericValue);

    res.json(fData);
  } catch (error) {
    console.error("Error processing Bhavcopy comparison:", error);
    res.status(500).json({
      error: "Failed to fetch and compare Bhavcopy data",
      details: error.message,
    });
  }
});

app.get("/sector-daily", async (req, res) => {
  try {
    const { date, order, value } = req.query;
    const numericValue = Number(value);

    if (!date) {
      return res.status(400).json({
        error:
          "At least one date parameter is required in format DD-MMM-YYYY. Example: date=04-Feb-2025,05-Feb-2025",
      });
    }

    // Convert date string into an array of dates
    const dates = date.split(",").map((d) => d.trim());

    if (dates.length < 2) {
      return res
        .status(400)
        .json({ error: "At least two dates are required for comparison" });
    }

    // Get NSE session cookies
    const cookies = await getNseCookies();
    if (!cookies) {
      return res
        .status(500)
        .json({ error: "Failed to fetch NSE session cookies" });
    }

    // Fetch Bhavcopy Data for each date
    const bhavcopyData = {};
    for (let d of dates) {
      bhavcopyData[d] = await fetchSectorcopyData(d, cookies);
    }

    // Compare data between the latest two dates
    const [earlierDate, laterDate] = dates.slice(-2); // Get the last two dates
    const earlierData = bhavcopyData[earlierDate] || [];
    const laterData = bhavcopyData[laterDate] || [];

    // Create a map for earlier date data
    const earlierMap = {};
    earlierData.forEach((item) => {
      earlierMap[item.INDEX] = item;
    });

    // Filter laterData where LAST_PRICE increased compared to earlier LAST_PRICE
    const filteredData = laterData.filter((item) => {
      const earlierEntry = earlierMap[item.INDEX];
      if (!earlierEntry) return false;

      return item;
    });

    // Build response data with additional calculations
    const finaldata = filteredData.map((data) => {
      const earlierEntry = earlierMap[data.INDEX]; // Get the earlier entry
      const lastPriceEarlier = earlierEntry
        ? earlierEntry["PREVIOUS CLOSE"]
        : null;
      const lastPriceLater = data["CLOSE"];

      // Calculate Log Return: LN(C2/B2)
      const logReturn =
        lastPriceEarlier && lastPriceLater
          ? Math.log(lastPriceLater / lastPriceEarlier)
          : null;

      // Calculate Percentage Change: ((C2 - B2) / B2) * 100
      const percentageChange =
        lastPriceEarlier && lastPriceLater
          ? ((lastPriceLater - lastPriceEarlier) / lastPriceEarlier) * 100
          : null;

      return {
        INDEX: data["INDEX"],
        // EARLIER_DATE: earlierDate, // Add the earlier date for reference
        // LATER_DATE: laterDate, // Add the later date for reference
        PREVIOUS_CLOSE_YESTERDAY: lastPriceEarlier, // Earlier Date's LAST_PRICE
        CLOSE_TODAY: lastPriceLater, // Current Date's LAST_PRICE
        // LOG_RETURN: logReturn ? logReturn.toFixed(6) : null, // Natural log return LN(C2/B2)
        PERCENTAGE_CHANGE: percentageChange
          ? percentageChange.toFixed(2) + "%"
          : null, // Percentage change
      };
    });

    if (order == "desc") {
      finaldata.sort((a, b) => {
        return (
          parseFloat(b.PERCENTAGE_CHANGE) - parseFloat(a.PERCENTAGE_CHANGE)
        );
      });
    } else {
      finaldata.sort((a, b) => {
        return (
          parseFloat(a.PERCENTAGE_CHANGE) - parseFloat(b.PERCENTAGE_CHANGE)
        );
      });
    }
    let fData = [];
    if (isNaN(numericValue)) {
      fData = finaldata;
      fData = fData.filter((data) => niftyIndices.has(data.INDEX));
    } else {
      fData = finaldata;
      fData = fData.filter((data) => niftyIndices.has(data.INDEX));
      fData = fData.slice(0, numericValue);
    }
    res.json(fData);
  } catch (error) {
    console.error("Error processing Bhavcopy comparison:", error);
    res.status(500).json({
      error: "Failed to fetch and compare Bhavcopy data",
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
