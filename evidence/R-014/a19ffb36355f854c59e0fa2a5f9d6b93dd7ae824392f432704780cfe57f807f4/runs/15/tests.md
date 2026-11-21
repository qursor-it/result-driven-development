# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-15@example.test and password RddPass-15! Name the project RDD project 15. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-15@example.test, password RddPass-15!, project RDD project 15. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:47 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:49:50) |
| Duration | `0h 2m 10s 80ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-15@example.test and password RddPass-15! Name the project RDD project 15. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-15@example.test, password RddPass-15!, project RDD project 15. Run exactly one scenario. No destructive operations outside this flow.

#### An anonymous visitor signs up with the given email and password, then creates their first project named RDD project 15 and lands on that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 130s 80ms |

**Steps**

- Test started. Session name: RomanticRoastedPink296 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill the Email field with a disposable test address. _(1467ms)_
- Fill the masked Password field with a disposable password. _(1493ms)_
- Submit the signup form to create the account. _(1146ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Fill the Project name field with the scenario project name. _(1349ms)_
- Submit the create-project form to create RDD project 15. _(1138ms)_
- Navigated to RDD project 15 — QA Notebook _(0ms)_
- Verification passed: The project dashboard page is displayed and shows the project name "RDD project 15" in its heading or header area. _(0ms)_
- The account is created and the user is no longer on the sign up form _(0ms)_
- A project named RDD project 15 exists and is owned by the signed-up user _(0ms)_
- The dashboard for the project RDD project 15 is displayed after submission _(0ms)_
- signup rdd+R-014-15@example.test created project RDD project 15 at /projects/1 _(0ms)_

**Message**

> signup rdd+R-014-15@example.test created project RDD project 15 at /projects/1

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("#email", "rdd+R-014-15@example.test")
I.fillField("#password", "RddPass-15!")
I.click({"role":"button","text":"Sign up"}, "form[action="/signup"]")
I.fillField("#name", "RDD project 15")
I.click({"role":"button","text":"Create project"}, "form[action="/projects/new"]")
I.see("RDD project 15", "h1")
I.seeElement({"role":"heading","text":"RDD project 15"})
I.see("RDD project 15", "main")
```
