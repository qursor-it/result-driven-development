# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-13@example.test and password RddPass-13! Name the project RDD project 13. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-13@example.test, password RddPass-13!, project RDD project 13. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:41 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:43:48) |
| Duration | `0h 2m 5s 978ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-13@example.test and password RddPass-13! Name the project RDD project 13. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-13@example.test, password RddPass-13!, project RDD project 13. Run exactly one scenario. No destructive operations outside this flow.

#### A new anonymous visitor signs up on /signup and then creates their first project named RDD project 13, ending on that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 125s 978ms |

**Steps**

- Test started. Session name: TinyEducationalBlue624 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Filling the Email field on the signup form with a unique test address. _(1458ms)_
- Filling the Password field with a valid test password. _(1291ms)_
- Submitting the signup form to create the account. _(1148ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Filling the Project name field to create the first project named RDD project 13. _(1285ms)_
- Submitting the form to create the first project named RDD project 13. _(1141ms)_
- Navigated to RDD project 13 — QA Notebook _(0ms)_
- Verification passed: The page is a project dashboard for the project named 'RDD project 13' — the project name 'RDD project 13' is displayed as the heading/title of the current project page, and the URL is /projects/1 _(0ms)_
- signed up as rdd+R-014-13@example.test on /signup _(0ms)_
- The new account is created and the user is signed in, leaving the signup form _(0ms)_
- created project "RDD project 13" via /projects/new _(0ms)_
- A project named RDD project 13 exists in the application _(0ms)_
- landed on /projects/1 with heading RDD project 13 _(0ms)_
- The dashboard for the RDD project 13 project is displayed to the user _(0ms)_

**Message**

> The dashboard for the RDD project 13 project is displayed to the user

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("Email", "rdd+R-014-13@example.test")
I.fillField("Password", "RddPass-13!")
I.click({"role":"button","text":"Sign up"})
I.fillField("Project name", "RDD project 13")
I.click({"role":"button","text":"Create project"})
I.see("RDD project 13", "h1")
I.seeInTitle("RDD project 13")
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-13@example.test", "main")
```
