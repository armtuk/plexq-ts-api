import { api, APIRequest, apiResultParse, APISettings } from "./Api"

const apiSettings: APISettings = {
  parseDates: true
}

const simpleResult = {
  "key": "value"
}

const compoundResult = {
  "a": "b",
  "obj": {
    "c": "d"
  }
}

const simpleDateResult = {
  "modifiedTimestamp": "2020-11-18T17:31:46.523Z"
}

const invalidDateResult = {
  "modifiedTimestamp": "Not A Date"
}

const compoundResultWithDate = {
  "a": "b",
  "obj": {
    "modifiedTimestamp": "2020-11-18T17:31:46.523Z",
    "c": "d"
  }
}

const orgResult = {
  "data": [
    {
      "id": 3434,
      "clientId": 2,
      "name": "Adolescent Counseling Services",
      "description": "",
      "comments": null,
      "address": {
        "id": 7,
        "address1": "",
        "address2": "",
        "city": "",
        "region": "",
        "postalCode": ""
      },
      "internshipSite": {
        "id": 3569,
        "organizationId": 3434,
        "clientId": 2,
        "clientCycleId": 5,
        "totalOpenings": 9,
        "identityCode": null,
        "name": "Adolescent Counseling Services",
        "description": "",
        "duesPaid": false,
        "attestationFiled": false,
        "questionnaireComplete": false,
        "modifiedTimestamp": "2020-11-18T17:31:46.523Z",
        "directoryQuestionnaireId": 396,
        "siteTracks": [{
          "id": 3761,
          "internshipSiteId": 3569,
          "name": "OUTLET for LGBTQ+ Youth",
          "description": null,
          "openings": 2,
          "siteTrackType": 1,
          "modifiedTimestamp": "2019-11-20T10:03:46.489Z"
        }, {
          "id": 3769,
          "internshipSiteId": 3569,
          "name": "On Campus Programming",
          "description": "School based services in middle and high schools and youth clubs.",
          "openings": 2,
          "siteTrackType": 1,
          "modifiedTimestamp": "2019-11-20T10:04:05.054Z"
        }, {
          "id": 3770,
          "internshipSiteId": 3569,
          "name": "Community Counseling",
          "description": "General out patients services to youth (and their families) age 10-25 for mild to moderate mental health challenges.",
          "openings": 1,
          "siteTrackType": 1,
          "modifiedTimestamp": "2019-11-20T10:04:11.156Z"
        }, {
          "id": 3768,
          "internshipSiteId": 3569,
          "name": "Alcohol and Substance Use",
          "description": "Adolescent Substance Abuse Treatment program inclusive of in-depth assessment services, individual and family therapy, education up to full IOP programming.",
          "openings": 4,
          "siteTrackType": 1,
          "modifiedTimestamp": "2019-11-20T10:03:55.805Z"
        }]
      }
    }]
}

test('apiParseResult should parse a simple result', () => {
  expect(apiResultParse(apiSettings, simpleResult)).toStrictEqual(simpleResult)
})

test('apiParseResult should parse a compound result', () => {
  expect(apiResultParse(apiSettings, compoundResult)).toStrictEqual(compoundResult)
})

test('apiParseResult should parse a simple result with date', () => {
  expect(apiResultParse(apiSettings, simpleDateResult)).toStrictEqual({"modifiedTimestamp": new Date(Date.parse(simpleDateResult.modifiedTimestamp))})
})

test('apiParseResult should parse a compound result with date', () => {
  expect(apiResultParse(apiSettings, compoundResultWithDate)).toStrictEqual({
    "a": "b", "obj": {
      "modifiedTimestamp": new Date(Date.parse(compoundResultWithDate.obj.modifiedTimestamp)),
      "c": "d"
    }
  })
})

test('apiParseResult should parse a invalid date and return undefined', () => {
  expect(apiResultParse(apiSettings, invalidDateResult)).toEqual({"modifiedTimestamp": undefined})
})

test('apiParseResult should parse an array of numbers', () => {
  expect(apiResultParse(apiSettings, [1, 2, 3])).toStrictEqual([1, 2, 3])
})

test('apiParseResult should parse an array of objects', () => {
  expect(apiResultParse(apiSettings, [{"a": "b"}, {"c": "d"}])).toStrictEqual([{"a": "b"}, {"c": "d"}])
})

test('apiParseResult should parse an array of objects', () => {
  expect(apiResultParse(apiSettings, [{"a": "b"}, {"c": "d"}])).toStrictEqual([{"a": "b"}, {"c": "d"}])
})

test('apiParseResult should parse an object of arrays', () => {
  expect(apiResultParse(apiSettings, {"a": [{"b": "c"}, {"e": "f"}]})).toStrictEqual({"a": [{"b": "c"}, {"e": "f"}]})
})

test('apiParseResult should parse an organization result', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const parsed = apiResultParse(apiSettings, orgResult)

  expect(parsed.data[0].internshipSite.siteTracks.length).toBeGreaterThan(1)
})

test("apiParseResult should parse a result with timezone and NOT turn it into a date", () => {
  const parsed = apiResultParse(apiSettings,{"data": {"timezone": "America/New York"}})

  expect(parsed.data.timezone).toBe("America/New York")
})