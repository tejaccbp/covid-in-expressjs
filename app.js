const express = require("express"); //using express library package from npm
const app = express(); // creating instance
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
app.use(express.json());

const databasePath = path.join(__dirname, "covid19India.db");
let db = null;

const initializingDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("http server starts and  runs at port 3000");
    });
  } catch (e) {
    console.log(`Db Error:${e.message}`);
    process.exit(1);
  }
};

initializingDbAndServer();

const convertingDistrictDbObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    sateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertingStateDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT
      *
    FROM
      state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) =>
      convertingStateDbObjectToResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const oneStateQuery = `
  select * 
  FROM state
    WHERE state_id=${stateId};`;
  const state = await db.get(oneStateQuery);
  response.send(convertingStateDbObjectToResponseObject(state));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrict = `INSERT INTO 
  district(district_name,state_id,cases,cured,active,deaths)
  VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(addDistrict);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    SELECT
      *
    FROM
     district
    WHERE
      district_id = ${districtId};`;
  const district1 = await db.get(getDistrictsQuery);
  response.send(convertingDistrictDbObjectToResponseObject(district1));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const distUpdateQuery = `UPDATE district 
SET district_name="${districtName}",
    state_id=${stateId},
cases=${cases},
cured=${cured},
active=${active},
deaths=${deaths}
WHERE district_id=${districtId};`;
  await db.run(distUpdateQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateStatistics = `SELECT sum(cases),sum(cured),sum(active),sum(deaths) FROM district WHERE state_id=${stateId};`;
  const stats = await db.get(stateStatistics);
  response.send({
    totalCases: stats["sum(cases)"],
    totalCured: stats["sum(cured)"],
    totalActive: stats["sum(active)"],
    totalDeaths: stats["sum(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameQuery = `select state_name FROM district NATURAL JOIN state WHERE district_id=${districtId}`;
  const oneState = await db.get(stateNameQuery);

  response.send({ stateName: oneState.state_name });
});
module.exports = app;
