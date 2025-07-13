const express = require("express");
const app = express();
const PORT = 3000;
const cors = require("cors");

app.use(cors());

const niftyMap = {
  ABB: "Not Found",
  ADANIENSOL: "Not Found",
  ADANIENT: "Nifty Metal",
  ADANIGREEN: "Not Found",
  ADANIPORTS: "Nifty Infrastructure",
  ADANIPOWER: "Not Found",
  AMBUJACEM: "Nifty MNC",
  APOLLOHOSP: "Nifty Healthcare",
  ASIANPAINT: "Nifty India Consumption",
  DMART: "Not Found",
  AXISBANK: "Nifty Private Bank",
  "BAJAJ-AUTO": "Nifty Auto",
  BAJFINANCE: "Nifty Financial Services",
  BAJAJFINSV: "Nifty Financial Services",
  BAJAJHLDNG: "Not Found",
  BAJAJHFL: "Not Found",
  BANKBARODA: "Nifty psu bank",
  BEL: "Nifty CPSE",
  BPCL: "Nifty Oil & Gas",
  BHARTIARTL: "Nifty Infrastructure",
  BOSCHLTD: "Not Found",
  BRITANNIA: "Nifty MNC",
  CGPOWER: "Nifty Energy",
  CANBK: "Nifty psu bank",
  CHOLAFIN: "Not Found",
  CIPLA: "Nifty Pharma",
  COALINDIA: "Nifty CPSE",
  DLF: "Nifty realty",
  DABUR: "Not Found",
  DIVISLAB: "Nifty Pharma",
  DRREDDY: "Nifty Pharma",
  DUMMYSIEMS: "Not Found",
  EICHERMOT: "Nifty Auto",
  ETERNAL: "Nifty India Consumption",
  GAIL: "Nifty Oil & Gas",
  GODREJCP: "Nifty FMCG",
  GRASIM: "Nifty Commodities",
  HCLTECH: "Nifty IT",
  HDFCBANK: "Nifty Financial Services",
  HDFCLIFE: "Nifty Financial Services",
  HAVELLS: "Nifty consumer durables",
  HEROMOTOCO: "Nifty Auto",
  HINDALCO: "Nifty Metal",
  HAL: "Nifty PSE",
  HINDUNILVR: "Nifty FMCG",
  HYUNDAI: "Not Found",
  ICICIBANK: "Nifty Financial Services",
  ICICIGI: "Not Found",
  ICICIPRULI: "Not Found",
  ITC: "Nifty FMCG",
  INDHOTEL: "Not Found",
  IOC: "Nifty Oil & Gas",
  IRFC: "Not Found",
  INDUSINDBK: "Nifty Private Bank",
  NAUKRI: "Not Found",
  INFY: "Nifty IT",
  INDIGO: "Nifty India Consumption",
  JSWENERGY: "Not Found",
  JSWSTEEL: "Nifty Metal",
  JINDALSTEL: "Nifty Metal",
  JIOFIN: "Nifty Financial Services",
  KOTAKBANK: "Nifty Private Bank",
  LTIM: "Nifty IT",
  LT: "Nifty Infrastructure",
  LICI: "Not Found",
  LODHA: "Nifty realty",
  "M&M": "Nifty Auto",
  MARUTI: "Nifty Auto",
  NTPC: "Nifty CPSE",
  NESTLEIND: "Nifty MNC",
  ONGC: "Nifty Oil & Gas",
  PIDILITIND: "Not Found",
  PFC: "Nifty PSE",
  POWERGRID: "Nifty CPSE",
  PNB: "Nifty psu bank",
  RECLTD: "Nifty PSE",
  RELIANCE: "Nifty Oil & Gas",
  SBILIFE: "Not Found",
  MOTHERSON: "Nifty Auto",
  SHREECEM: "Not Found",
  SHRIRAMFIN: "Nifty Financial Services",
  SIEMENS: "Not Found",
  SBIN: "Nifty psu bank",
  SUNPHARMA: "Nifty Pharma",
  SWIGGY: "Not Found",
  TVSMOTOR: "Nifty Auto",
  TCS: "Nifty IT",
  TATACONSUM: "Nifty FMCG",
  TATAMOTORS: "Nifty Auto",
  TATAPOWER: "Nifty Energy",
  TATASTEEL: "Nifty Metal",
  TECHM: "Nifty IT",
  TITAN: "Nifty consumer durables",
  TORNTPHARM: "Nifty Pharma",
  TRENT: "Nifty India Consumption",
  ULTRACEMCO: "Nifty Commodities",
  UNITDSPR: "Nifty MNC",
  VBL: "Nifty FMCG",
  VEDL: "Nifty Metal",
  WIPRO: "Nifty IT",
  ZYDUSLIFE: "Not Found",
};

async function getData(symbol, date, retries = 3, timeout = 5000) {
  const fetchWithTimeout = (url, options, timeout) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeout)
      ),
    ]);
  };

  for (let i = 0; i < retries; i++) {
    // console.log(`https://www.nseindia.com/api/historicalOR/generateSecurityWiseHistoricalData?from=${date}&to=${date}&symbol=${symbol}&type=priceVolumeDeliverable&series=EQ`);

    try {
      const response = await fetchWithTimeout(
        `https://www.nseindia.com/api/historicalOR/generateSecurityWiseHistoricalData?from=${date}&to=${date}&symbol=${symbol}&type=priceVolumeDeliverable&series=EQ`,
        {},
        timeout
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const json = await response.json();
      return json;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      if (i === retries - 1) throw error;
    }
  }
}

function convertDateFormat(dateStr) {
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

  const [day, month, year] = dateStr.split("-");
  return `${day}-${months[month]}-${year}`;
}

app.get("/nse-bhavcopy", async (req, res) => {
  try {
    // const { date ,value} = req.query;
    const { date, value, filter } = req.query;
    const numericValue = Number(value);
    const dateArray = date.split(",");
    const startDate = convertDateFormat(dateArray[0]);
    const endDate = convertDateFormat(dateArray[dateArray.length - 1]);
    const promises = [];

    for (let key in niftyMap) {
      promises.push(getData(key, startDate));
    }

    const results = await Promise.all(promises);
    const earlierData = {
      data: results.flatMap((result) => result.data),
    };

    const promises1 = [];
    for (let key in niftyMap) {
      promises1.push(getData(key, endDate));
    }
    const results1 = await Promise.all(promises1);
    const laterData = {
      data: results1.flatMap((result) => result.data),
    };
    let combinedData2 = { data: [] };
    combinedData2.data = [...earlierData.data, ...laterData.data];

    const earlierMap = {};
    earlierData.data.forEach((item) => {
      earlierMap[item.CH_SYMBOL] = item;
    });

    const filteredData = laterData.data.filter((item) => {
      const earlierEntry = earlierMap[item.CH_SYMBOL];
      if (!earlierEntry) return false;
      if (numericValue == 0) {
        const isValid =
          item.CH_TOT_TRADED_QTY > earlierEntry.CH_TOT_TRADED_QTY &&
          item.COP_DELIV_QTY > earlierEntry.COP_DELIV_QTY;

        if (
          isValid &&
          earlierEntry.CH_TRADE_LOW_PRICE < item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_TRADE_HIGH_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_LAST_TRADED_PRICE
        ) {
          item.THH = true;
        } else if (
          isValid &&
          earlierEntry.CH_TRADE_LOW_PRICE < item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_TRADE_HIGH_PRICE
        ) {
          item.HH = true;
        }
        if (
          isValid &&
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE > item.CH_TRADE_HIGH_PRICE &&
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_LAST_TRADED_PRICE
        ) {
          item.TLL = true;
        } else if (
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE > item.CH_TRADE_HIGH_PRICE
        ) {
          item.LL = true;
        }
        if (
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_TRADE_HIGH_PRICE
        ) {
          item.HV = true;
        }
        if (
          earlierEntry.CH_TRADE_LOW_PRICE < item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE > item.CH_TRADE_HIGH_PRICE
        ) {
          item.LV = true;
        }
        return isValid;
      } else if (numericValue == 1) {
        const isValid =
          item.CH_TOT_TRADED_QTY > earlierEntry.CH_TOT_TRADED_QTY ||
          item.COP_DELIV_QTY > earlierEntry.COP_DELIV_QTY;
        if (
          isValid &&
          earlierEntry.CH_TRADE_LOW_PRICE < item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_TRADE_HIGH_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_LAST_TRADED_PRICE
        ) {
          item.THH = true;
        } else if (
          isValid &&
          earlierEntry.CH_TRADE_LOW_PRICE < item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_TRADE_HIGH_PRICE
        ) {
          item.HH = true;
        }
        if (
          isValid &&
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE > item.CH_TRADE_HIGH_PRICE &&
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_LAST_TRADED_PRICE
        ) {
          item.TLL = true;
        } else if (
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE > item.CH_TRADE_HIGH_PRICE
        ) {
          item.LL = true;
        }
        if (
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_TRADE_HIGH_PRICE
        ) {
          item.HV = true;
        }
        if (
          earlierEntry.CH_TRADE_LOW_PRICE < item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE > item.CH_TRADE_HIGH_PRICE
        ) {
          item.LV = true;
        }
        return isValid;
      } else if (numericValue == 2) {
        const isValid =
          item.CH_TOT_TRADED_QTY > earlierEntry.CH_TOT_TRADED_QTY &&
          item.COP_DELIV_QTY > earlierEntry.COP_DELIV_QTY;
        if (
          isValid &&
          earlierEntry.CH_TRADE_LOW_PRICE < item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_TRADE_HIGH_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_LAST_TRADED_PRICE
        ) {
          item.THH = true;
        } else if (
          isValid &&
          earlierEntry.CH_TRADE_LOW_PRICE < item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_TRADE_HIGH_PRICE
        ) {
          item.HH = true;
        }
        if (
          isValid &&
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE > item.CH_TRADE_HIGH_PRICE &&
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_LAST_TRADED_PRICE
        ) {
          item.TLL = true;
        } else if (
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE > item.CH_TRADE_HIGH_PRICE
        ) {
          item.LL = true;
        }
        if (
          earlierEntry.CH_TRADE_LOW_PRICE > item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE < item.CH_TRADE_HIGH_PRICE
        ) {
          item.HV = true;
        }
        if (
          earlierEntry.CH_TRADE_LOW_PRICE < item.CH_TRADE_LOW_PRICE &&
          earlierEntry.CH_TRADE_HIGH_PRICE > item.CH_TRADE_HIGH_PRICE
        ) {
          item.LV = true;
        }
        return isValid;
      }
    });
    const data = [
      { Industry: "Capital Goods", Symbol: "ABB" },
      { Industry: "Power", Symbol: "ADANIENSOL" },
      { Industry: "Metals & Mining", Symbol: "ADANIENT" },
      { Industry: "Power", Symbol: "ADANIGREEN" },
      { Industry: "Services", Symbol: "ADANIPORTS" },
      { Industry: "Power", Symbol: "ADANIPOWER" },
      { Industry: "Construction Materials", Symbol: "AMBUJACEM" },
      { Industry: "Healthcare", Symbol: "APOLLOHOSP" },
      { Industry: "Consumer Durables", Symbol: "ASIANPAINT" },
      { Industry: "Consumer Services", Symbol: "DMART" },
      { Industry: "Financial Services", Symbol: "AXISBANK" },
      { Industry: "Automobile and Auto Components", Symbol: "BAJAJ-AUTO" },
      { Industry: "Financial Services", Symbol: "BAJFINANCE" },
      { Industry: "Financial Services", Symbol: "BAJAJFINSV" },
      { Industry: "Financial Services", Symbol: "BAJAJHLDNG" },
      { Industry: "Financial Services", Symbol: "BAJAJHFL" },
      { Industry: "Financial Services", Symbol: "BANKBARODA" },
      { Industry: "Capital Goods", Symbol: "BEL" },
      { Industry: "Oil Gas & Consumable Fuels", Symbol: "BPCL" },
      { Industry: "Telecommunication", Symbol: "BHARTIARTL" },
      { Industry: "Automobile and Auto Components", Symbol: "BOSCHLTD" },
      { Industry: "Fast Moving Consumer Goods", Symbol: "BRITANNIA" },
      { Industry: "Capital Goods", Symbol: "CGPOWER" },
      { Industry: "Financial Services", Symbol: "CANBK" },
      { Industry: "Financial Services", Symbol: "CHOLAFIN" },
      { Industry: "Healthcare", Symbol: "CIPLA" },
      { Industry: "Oil Gas & Consumable Fuels", Symbol: "COALINDIA" },
      { Industry: "Realty", Symbol: "DLF" },
      { Industry: "Fast Moving Consumer Goods", Symbol: "DABUR" },
      { Industry: "Healthcare", Symbol: "DIVISLAB" },
      { Industry: "Healthcare", Symbol: "DRREDDY" },
      { Industry: "Capital Goods", Symbol: "DUMMYSIEMS" },
      { Industry: "Automobile and Auto Components", Symbol: "EICHERMOT" },
      { Industry: "Consumer Services", Symbol: "ETERNAL" },
      { Industry: "Oil Gas & Consumable Fuels", Symbol: "GAIL" },
      { Industry: "Fast Moving Consumer Goods", Symbol: "GODREJCP" },
      { Industry: "Construction Materials", Symbol: "GRASIM" },
      { Industry: "Information Technology", Symbol: "HCLTECH" },
      { Industry: "Financial Services", Symbol: "HDFCBANK" },
      { Industry: "Financial Services", Symbol: "HDFCLIFE" },
      { Industry: "Consumer Durables", Symbol: "HAVELLS" },
      { Industry: "Automobile and Auto Components", Symbol: "HEROMOTOCO" },
      { Industry: "Metals & Mining", Symbol: "HINDALCO" },
      { Industry: "Capital Goods", Symbol: "HAL" },
      { Industry: "Fast Moving Consumer Goods", Symbol: "HINDUNILVR" },
      { Industry: "Automobile and Auto Components", Symbol: "HYUNDAI" },
      { Industry: "Financial Services", Symbol: "ICICIBANK" },
      { Industry: "Financial Services", Symbol: "ICICIGI" },
      { Industry: "Financial Services", Symbol: "ICICIPRULI" },
      { Industry: "Fast Moving Consumer Goods", Symbol: "ITC" },
      { Industry: "Consumer Services", Symbol: "INDHOTEL" },
      { Industry: "Oil Gas & Consumable Fuels", Symbol: "IOC" },
      { Industry: "Financial Services", Symbol: "IRFC" },
      { Industry: "Financial Services", Symbol: "INDUSINDBK" },
      { Industry: "Consumer Services", Symbol: "NAUKRI" },
      { Industry: "Information Technology", Symbol: "INFY" },
      { Industry: "Services", Symbol: "INDIGO" },
      { Industry: "Power", Symbol: "JSWENERGY" },
      { Industry: "Metals & Mining", Symbol: "JSWSTEEL" },
      { Industry: "Metals & Mining", Symbol: "JINDALSTEL" },
      { Industry: "Financial Services", Symbol: "JIOFIN" },
      { Industry: "Financial Services", Symbol: "KOTAKBANK" },
      { Industry: "Information Technology", Symbol: "LTIM" },
      { Industry: "Construction", Symbol: "LT" },
      { Industry: "Financial Services", Symbol: "LICI" },
      { Industry: "Realty", Symbol: "LODHA" },
      { Industry: "Automobile and Auto Components", Symbol: "M&M" },
      { Industry: "Automobile and Auto Components", Symbol: "MARUTI" },
      { Industry: "Power", Symbol: "NTPC" },
      { Industry: "Fast Moving Consumer Goods", Symbol: "NESTLEIND" },
      { Industry: "Oil Gas & Consumable Fuels", Symbol: "ONGC" },
      { Industry: "Chemicals", Symbol: "PIDILITIND" },
      { Industry: "Financial Services", Symbol: "PFC" },
      { Industry: "Power", Symbol: "POWERGRID" },
      { Industry: "Financial Services", Symbol: "PNB" },
      { Industry: "Financial Services", Symbol: "RECLTD" },
      { Industry: "Oil Gas & Consumable Fuels", Symbol: "RELIANCE" },
      { Industry: "Financial Services", Symbol: "SBILIFE" },
      { Industry: "Automobile and Auto Components", Symbol: "MOTHERSON" },
      { Industry: "Construction Materials", Symbol: "SHREECEM" },
      { Industry: "Financial Services", Symbol: "SHRIRAMFIN" },
      { Industry: "Capital Goods", Symbol: "SIEMENS" },
      { Industry: "Financial Services", Symbol: "SBIN" },
      { Industry: "Healthcare", Symbol: "SUNPHARMA" },
      { Industry: "Consumer Services", Symbol: "SWIGGY" },
      { Industry: "Automobile and Auto Components", Symbol: "TVSMOTOR" },
      { Industry: "Information Technology", Symbol: "TCS" },
      { Industry: "Fast Moving Consumer Goods", Symbol: "TATACONSUM" },
      { Industry: "Automobile and Auto Components", Symbol: "TATAMOTORS" },
      { Industry: "Power", Symbol: "TATAPOWER" },
      { Industry: "Metals & Mining", Symbol: "TATASTEEL" },
      { Industry: "Information Technology", Symbol: "TECHM" },
      { Industry: "Consumer Durables", Symbol: "TITAN" },
      { Industry: "Healthcare", Symbol: "TORNTPHARM" },
      { Industry: "Consumer Services", Symbol: "TRENT" },
      { Industry: "Construction Materials", Symbol: "ULTRACEMCO" },
      { Industry: "Fast Moving Consumer Goods", Symbol: "UNITDSPR" },
      { Industry: "Fast Moving Consumer Goods", Symbol: "VBL" },
      { Industry: "Metals & Mining", Symbol: "VEDL" },
      { Industry: "Information Technology", Symbol: "WIPRO" },
      { Industry: "Healthcare", Symbol: "ZYDUSLIFE" },
    ];

    const industryMap = data.reduce((acc, item) => {
      acc[item.Symbol] = item.Industry;
      return acc;
    }, {});

    const finaldata = [];
    filteredData.map((data) => {
      const earlierEntry = earlierMap[data.CH_SYMBOL]; // Get earlier date data
      let obj = {
        CH_SYMBOL: data["CH_SYMBOL"],
        // DEL_QTY_TODAY: data["COP_DELIV_QTY"],
        Industry: industryMap[data["CH_SYMBOL"]],
        DEL_PER_TODAY: data["COP_DELIV_PERC"], // Current date COP_DELIV_PERC
        // DEL_QTY_YESTERDAY: earlierEntry ? earlierEntry["COP_DELIV_QTY"] : null, // Earlier date COP_DELIV_PERC
        NAME: niftyMap[data.CH_SYMBOL],
      };
      if (data.TLL != undefined) obj.PATTERN = data.TLL ? "TLL" : "---";
      else if (data.THH != undefined) obj.PATTERN = data.THH ? "THH" : "---";
      else if (data.HH != undefined) obj.PATTERN = data.HH ? "HH" : "---";
      else if (data.LL != undefined) obj.PATTERN = data.LL ? "LL" : "---";
      else if (data.HV != undefined) obj.PATTERN = data.HV ? "HV" : "---";
      else if (data.LV != undefined) obj.PATTERN = data.LV ? "LV" : "---";
      else obj.PATTERN = "---";
      if (numericValue == 2) {
        if (obj.DEL_PER_TODAY > filter) {
          const industry = industryMap[obj.CH_SYMBOL];
          let symbolsList = [];
          for (let [key, value] of Object.entries(industryMap)) {
            if (value === industry) {
              symbolsList.push(key);
            }
          }
          let fSet = new Set(symbolsList);
          let sumearlierData = 0;
          let sumlaterData = 0;
          earlierData.data.forEach((val) => {
            if (fSet.has(val.CH_SYMBOL)) {
              sumearlierData += val.CH_TOT_TRADED_QTY;
            }
          });
          laterData.data.forEach((val) => {
            if (fSet.has(val.CH_SYMBOL)) {
              sumlaterData += val.CH_TOT_TRADED_QTY;
            }
          });

          // Calculate the ratio and store it directly
          const ratio =
            sumlaterData !== 0
              ? (sumearlierData / sumlaterData).toFixed(2)
              : "Infinity";
          obj["SEC_BREAKOUT"] = ratio;

          finaldata.push(obj);
        }
      } else {
        // if (validSymbols.has(obj.CH_SYMBOL)) {
        finaldata.push(obj);
        // }
      }
    });

    /////// Start Add VB, DB, PB logic after finaldata is fully prepared //////
    finaldata.forEach((obj) => {
      const data = laterData.data.find((d) => d.CH_SYMBOL === obj.CH_SYMBOL);
      const earlierEntry = earlierMap[obj.CH_SYMBOL];

      if (!data || !earlierEntry) return;

      // Volume Breakout Ratio
      if (earlierEntry.CH_TOT_TRADED_QTY > 0) {
        obj.VB = parseFloat(
          (data.CH_TOT_TRADED_QTY / earlierEntry.CH_TOT_TRADED_QTY).toFixed(2)
        );
      }

      // Delivery Breakout Ratio
      if (earlierEntry.COP_DELIV_QTY > 0) {
        obj.DB = parseFloat(
          (data.COP_DELIV_QTY / earlierEntry.COP_DELIV_QTY).toFixed(2)
        );
      }

      // Price Breakout Ratio
      if (earlierEntry.CH_PREVIOUS_CLS_PRICE > 0) {
        obj.PB = parseFloat(
          (
            data.CH_LAST_TRADED_PRICE / earlierEntry.CH_PREVIOUS_CLS_PRICE
          ).toFixed(2)
        );
      }
    });

    // ✅ Now send the response
    res.json(finaldata);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/gainer-looser", async (req, res) => {
  try {
    // const { date ,value} = req.query;
    const { date, value, filter, order } = req.query;
    const numericValue = Number(value);
    const dateArray = date.split(",");
    const startDate = convertDateFormat(dateArray[dateArray.length - 1]);
    console.log(startDate);

    // const endDate = convertDateFormat(dateArray[dateArray.length - 1]);
    const promises = [];
    console.log(order);

    for (let key in niftyMap) {
      promises.push(getData(key, startDate));
    }

    const results = await Promise.all(promises);
    let earlierData = {
      data: results.flatMap((result) => result.data),
    };

    earlierData.data.forEach((item) => {
      item.percentageChange =
        ((item.CH_LAST_TRADED_PRICE - item.CH_PREVIOUS_CLS_PRICE) /
          item.CH_PREVIOUS_CLS_PRICE) *
        100;
    });

    earlierData = earlierData.data.map((data) => {
      return {
        CH_SYMBOL: data.CH_SYMBOL,
        sector: niftyMap[data.CH_SYMBOL],
        percentageChange: data.percentageChange.toFixed(3),
      };
    });
    if (order == "desc") {
      earlierData.sort((a, b) => {
        return parseFloat(b.percentageChange) - parseFloat(a.percentageChange);
      });
    } else {
      earlierData.sort((a, b) => {
        return parseFloat(a.percentageChange) - parseFloat(b.percentageChange);
      });
    }
    const fData = earlierData.slice(0, numericValue);

    res.json(fData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
