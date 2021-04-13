"use strict";

const request = require("supertest");
const db = require('../db')
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token,
  testIds
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: 'Team Lead',
          salary: 100000,
          equity: .5,
          company_handle: 'c1'
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
    job: {
      id: expect.any(Number),
      title: 'Team Lead',
      salary: 100000,
      equity: "0.5",
      company_handle: 'c1'
    }});
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: "new",
          equity: .11,
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/jobs")
        .send({
          title: 'Team Lead',
          salary: 'not-a-num',
          equity: .5,
          company_handle: 'c1'
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post(`/jobs`)
        .send({
          title: 'Team Lead',
          salary: 100000,
          equity: '.5',
          company_handle: 'c1'
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .post(`/jobs`)
        .send({
          title: 'Team Lead',
          salary: 100000,
          equity: '.5',
          company_handle: 'c1'
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
    jobs:
          [
            {
              id: expect.any(Number),
              title: "j1",
              salary: 20000,
              equity: "1",
              company_handle: "c1",
            },
            {
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
                equity: "0.11",
                company_handle: "c3",
            },
          ],
    });
  });

    test('fails: minSalary NaN', async function () {
      try {
        const resp = await request(app).get("/jobs").query({minSalary: "foo"});
      } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();
      }
    });

    test('hasEquity filter works', async function () {
        const resp = await request(app).get("/jobs").query({ hasEquity: true });
        expect(resp.body).toEqual({
          jobs:
                [
                  {
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
                      equity: "0.11",
                      company_handle: "c3",
                  },
                ],
          });
    });

    test('minSalary filter works', async function () {
      const resp = await request(app).get("/jobs").query({minSalary: 40000});
      expect(resp.body).toEqual({
        jobs:
              [
                {
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
                  equity: "0.11",
                  company_handle: "c3",
                },
              ],
        });
  });

  test('title filter works', async function () {
    const resp = await request(app).get("/jobs").query({title: '1'});
    expect(resp.body).toEqual({
      jobs:
            [
              {
                id: expect.any(Number),
                title: "j1",
                salary: 20000,
                equity: "1",
                company_handle: "c1",
              },
            ],
      });
});

test('filter works 2 criteria', async function () {
  const resp = await request(app).get("/jobs").query({minSalary: 40000, hasEquity: 0});
  expect(resp.body).toEqual({
    jobs:
          [
            {
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
              equity: "0.11",
              company_handle: "c3",
            },
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
        .get("/jobs")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });
})

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/${testIds[0]}`);
    expect(resp.body).toEqual({
      job: {
        id: testIds[0],
        title: "j1",
        salary: 20000,
        equity: "1",
        company_handle: "c1"
      }
    });
  });

  test("not found for job", async function () {
    const resp = await request(app).get(`/jobs/0`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          title: "j1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({
      job: {
        id: testIds[0],
        title: "j1-new",
        salary: 20000,
        equity: "1",
        company_handle: "c1"
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          title: "j1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          title: "j1-new"
        })
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such job", async function () {
    const resp = await request(app)
        .patch(`/jobs/0`)
        .send({
          title: "new nope"
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on id change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          id: "c1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on company_handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          company_handle: "c3",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testIds[0]}`)
        .send({
          salary: "not-a-num",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admins", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.body).toEqual({ deleted: `${testIds[0]}` });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non-admin", async function () {
    const resp = await request(app)
        .delete(`/jobs/${testIds[0]}`)
        .set("authorization", `Bearer ${u2Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found for no such job", async function () {
    const resp = await request(app)
        .delete(`/jobs/0`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(404);
  });
});
