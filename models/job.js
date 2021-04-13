"use strict";

const db = require("../db");

const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ title, salary, equity, company_handle }) {
    const duplicateCheck = await db.query(`SELECT title
    FROM jobs
    WHERE (title, company_handle) = ($1, $2)`,[title, company_handle]);

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate job: ${title}`);}

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle`,
        [
          title,
          salary,
          equity,
          company_handle
        ]
    );
    const job = result.rows[0];
    if (!job) {throw new BadRequestError();}

    return job;
  }

  /** Find all jobs.
   * Optional filter criteria to limit by title, minimum salary, or whether equity is offered
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * 
   * */

  static async findAll(criteria = {}) {
    let baseQuery = `SELECT id,
    title,
    salary,
    equity,
    company_handle
    FROM jobs`;
    let fields = [];
    let values = [];
    const {  minSalary, title, hasEquity } = criteria;
    if (minSalary != undefined) {
      values.push(minSalary);
      fields.push(`salary >= $${values.length}`);
    }
    if (title) {
      values.push(`%${title}%`);
      fields.push(`title ILIKE $${values.length}`);
    }
    if (hasEquity) {
        fields.push(`equity > 0`);
      }
    if (fields.length > 0) {
      baseQuery += " WHERE " + fields.join(" AND ");
    }
    baseQuery += " ORDER BY title";
    let jobsRes
    if (fields.length > 0) {
      jobsRes = await db.query(baseQuery, values);
    } else {
      jobsRes = await db.query(baseQuery);
    }

    if (!jobsRes) {throw new NotFoundError(`No jobs`);}
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *   where id is :id
   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
           title,
           salary,
           equity,
           company_handle
           FROM jobs
           WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) {throw new NotFoundError(`No job: ${id}`);}

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns {id, title, salary, equity, company_handle}
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          title: "title",
          salary: "salary",
          equity: "equity"
        });
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) {throw new NotFoundError(`No job: ${id}`);}

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) {throw new NotFoundError(`No job: ${id}`);}
  }
}

module.exports = Job;
