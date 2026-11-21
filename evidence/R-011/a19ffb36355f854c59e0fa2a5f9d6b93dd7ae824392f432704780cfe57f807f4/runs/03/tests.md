# Explorbot session /signup focus: "The interaction cost of signing up and creating a first project is measured on every run Actor: anonymous visitor, desktop. Given: page /signup of the qursor-qa-tester demo (demo/server.mjs, port 4318), state reset before each run. Expected outcomes: a project owned by the new user exists; the user sees that project's dashboard. Use email rdd+R-011-3@example.test and password RddPass-3! Name the project RDD project 3. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-011-3@example.test, password RddPass-3!, project RDD project 3. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:04 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:07:44) |
| Duration | `0h 2m 48s 204ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: The interaction cost of signing up and creating a first project is measured on every run Actor: anonymous visitor, desktop. Given: page /signup of the qursor-qa-tester demo (demo/server.mjs, port 4318), state reset before each run. Expected outcomes: a project owned by the new user exists; the user sees that project's dashboard. Use email rdd+R-011-3@example.test and password RddPass-3! Name the project RDD project 3. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-011-3@example.test, password RddPass-3!, project RDD project 3. Run exactly one scenario. No destructive operations outside this flow.

#### Sign up as a new user and create the first project so that the new project exists and its dashboard is shown to the user.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 168s 204ms |

**Steps**

- Test started. Session name: StatisticalOrdinaryJade16 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill the Email field of the signup form with a unique test address containing the required marker token. _(1449ms)_
- Fill the Password field with a valid password value. _(1250ms)_
- Submit the signup form to create the new account and proceed to the authenticated area. _(1169ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Fill the Project name field with the required project name 'RDD project 3' on the create-first-project form. _(1268ms)_
- The Project name field holds exactly 'RDD project 3' (confirmed by the page diff value attribute), so submit the form to create the project. _(1119ms)_
- Navigated to RDD project 3 — QA Notebook _(0ms)_
- The signup completes and the user is taken past the signup form to an authenticated area of the application _(0ms)_
- A project named RDD project 3 is created and exists for the newly signed up user _(0ms)_
- The dashboard of the RDD project 3 project is displayed to the user _(0ms)_
- /projects/1 shows h1 "RDD project 3", subtitle, Owner rdd+R-011-3@example.test _(0ms)_

**Message**

> /projects/1 shows h1 "RDD project 3", subtitle, Owner rdd+R-011-3@example.test

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField({"role":"textbox","text":"Email"}, "rdd+R-011-3@example.test")
I.fillField({"role":"textbox","text":"Password"}, "RddPass-3!")
I.click({"role":"button","text":"Sign up"}, "form[action="/signup"]")
I.fillField({"role":"textbox","text":"Project name"}, "RDD project 3")
I.click({"role":"button","text":"Create project"}, "form[action="/projects/new"]")
```
