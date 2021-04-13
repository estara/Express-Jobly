"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "new",
        salary: 100000,
        equity: 0.5,
        company_handle: 'c1'
      };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 100000,
      equity: "0.5",
      company_handle: 'c1'
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
        {
            id: expect.any(Number),
            title: "new",
            salary: 100000,
            equity: "0.5",
            company_handle: 'c1'
          }
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("doesn't work bad data", async function () {
    try {
      let job = await Job.create({
        title: "new",
        equity: 0.5,
        company_handle: 'c1'
      });
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([{
                    id: expect.any(Number),
                    title: "j1",
                    salary: 20000,
                    equity: "1",
                    company_handle: "c1"
                },
                {
                    id: expect.any(Number),
                    title: "j2",
                    salary: 40000,
                    equity: "0",
                    company_handle: "c1"
                },
                {
                    id: expect.any(Number),
                    title: "j3",
                    salary: 60000,
                    equity: "0.1",
                    company_handle: "c3"
                },
            ])
          });

  test('works: with filter', async function () {
    const criteria = {title: "j3", minSalary: 30000, hasEquity: true}
    let jobs = await Job.findAll(criteria);
    expect(jobs).toEqual([{
        id: expect.any(Number),
        title: "j3",
        salary: 60000,
        equity: "0.1",
        company_handle: "c3",
    }])
  });

  test('works: title filter', async function () {
    const criteria = {title: 'j1'};
    let jobs = await Job.findAll(criteria);
    expect(jobs).toEqual([{
        id: expect.any(Number),
        title: "j1",
        salary: 20000,
        equity: "1",
        company_handle: "c1",
    }])
  });
  
  test('works: minSalary filter', async function() {
    const criteria = {minSalary: 30000};
    let jobs = await Job.findAll(criteria);
    expect(jobs).toEqual([{
        id: expect.any(Number),
        title: "j2",
        salary: 40000,
        equity: "0",
        company_handle: "c1",
    },
    {
        id: expect.any(Number),
        title: "j3",
        salary: 60000,
        equity: "0.1",
        company_handle: "c3",
    }])
  });

  test('works: hasEquity filter', async function () {
    const criteria = {hasEquity: true};
    let jobs = await Job.findAll(criteria);
    expect(jobs).toEqual([{
        id: expect.any(Number),
        title: "j1",
        salary: 20000,
        equity: "1",
        company_handle: "c1",
    },
    {
        id: expect.any(Number),
        title: "j3",
        salary: 60000,
        equity: "0.1",
        company_handle: "c3",
    }])
  });
  
  test('errors when no jobs found', async function () {
    const criteria = {title: "j7", minSalary: 1000000, hasEquity: true}
    try {
    let jobs = await Job.findAll(criteria);
    } catch (err) {
    expect(err instanceof NotFoundError).toBeTruthy();
  }
  })
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(testIds[0]);
    expect(job).toEqual({
        id: testIds[0],
        title: "j1",
        salary: 20000,
        equity: "1",
        company_handle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "j4",
    salary: 200000,
    equity: 0.5
}

  test("works", async function () {
    let job = await Job.update(testIds[0], updateData);
    expect(job).toEqual({
      id: testIds[0],
      title: "j4",
      salary: 200000,
      equity: "0.5",
      company_handle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testIds[0]}`);
    expect(result.rows).toEqual([{
        id: expect.any(Number),
        title: "j4",
        salary: 200000,
        equity: "0.5",
        company_handle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
        salary: 200000,
        equity: .5,
    }

    let job = await Job.update(testIds[0], updateDataSetNulls);
    expect(job).toEqual({
      id: testIds[0],
      title: "j1",
      salary: 200000,
      equity: "0.5",
      company_handle: "c1"
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE id = ${testIds[0]}`);
    expect(result.rows).toEqual([{
        id: testIds[0],
        title: "j1",
        salary: 200000,
        equity: "0.5",
        company_handle: "c1"
    }]);
  });

  test("not found if no such job", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(testIds[0], {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(testIds[0]);
    const res = await db.query(
        `SELECT id FROM jobs WHERE id=$1`,[testIds[0]]);
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
