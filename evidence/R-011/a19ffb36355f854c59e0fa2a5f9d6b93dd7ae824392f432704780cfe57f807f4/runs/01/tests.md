# Explorbot session /signup focus: "The interaction cost of signing up and creating a first project is measured on every run Actor: anonymous visitor, desktop. Given: page /signup of the qursor-qa-tester demo (demo/server.mjs, port 4318), state reset before each run. Expected outcomes: a project owned by the new user exists; the user sees that project's dashboard. Use email rdd+R-011-1@example.test and password RddPass-1! Name the project RDD project 1. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-011-1@example.test, password RddPass-1!, project RDD project 1. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T05:58 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:01:41) |
| Duration | `0h 2m 46s 988ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: The interaction cost of signing up and creating a first project is measured on every run Actor: anonymous visitor, desktop. Given: page /signup of the qursor-qa-tester demo (demo/server.mjs, port 4318), state reset before each run. Expected outcomes: a project owned by the new user exists; the user sees that project's dashboard. Use email rdd+R-011-1@example.test and password RddPass-1! Name the project RDD project 1. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-011-1@example.test, password RddPass-1!, project RDD project 1. Run exactly one scenario. No destructive operations outside this flow.

#### Sign up with the provided credentials and create the first project so the new user sees that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 166s 988ms |

**Steps**

- Test started. Session name: UltimateWilyWhite79 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Click the Email field to focus it, then fill it with the test email address. _(2090ms)_
- Click the Password field to focus it, then fill it with the test password. _(1803ms)_
- Submit the sign-up form to create the test account. _(1197ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Focus the Project name field and fill it with the required project name RDD project 1. _(1801ms)_
- Submit the create-project form with the name RDD project 1. _(1167ms)_
- Navigated to RDD project 1 — QA Notebook _(0ms)_
- The new account is created and the user is signed in _(0ms)_
- A project owned by the new user exists with the name RDD project 1 _(0ms)_
- The dashboard for the newly created project RDD project 1 is displayed _(0ms)_
- URL /projects/1, h1 'RDD project 1', owner rdd+R-011-1@example.test _(0ms)_

**Message**

> URL /projects/1, h1 'RDD project 1', owner rdd+R-011-1@example.test

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.click("#email")
I.fillField("#email", "rdd+R-011-1@example.test")
I.click("#password")
I.fillField("#password", "RddPass-1!")
I.click({"role":"button","text":"Sign up"}, "form[action="/signup"]")
I.click("#name")
I.fillField("#name", "RDD project 1")
I.click({"role":"button","text":"Create project"}, "form[action="/projects/new"]")
```
