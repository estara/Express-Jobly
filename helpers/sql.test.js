
const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");


describe('parse info for partial update', function () {
    test('works update 1', function () {
        result = sqlForPartialUpdate({firstName: 'Aliya'}, {firstName: 'Sharon', age: 32});
        expect(result).toEqual({
            setCols: '"Sharon"=$1',
            values: ["Aliya"],
          })});
    
    test('errors when empty data', function () {
        try {
            result = sqlForPartialUpdate({}, {firstName: 'Sharon', age: 21});
        } catch (err) {
        expect(err instanceof BadRequestError).toBeTruthy();}
    });

    test('works update 2', function () {
        result = sqlForPartialUpdate({firstName: 'Aliya', age: 32}, {firstName: 'Sharon'});
        expect(result).toEqual({
            setCols: '"Sharon"=$1, "age"=$2',
            values: ["Aliya", 32],
    })});
})