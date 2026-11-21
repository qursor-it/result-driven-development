# Explorbot session /signup focus: "The interaction cost of signing up and creating a first project is measured on every run Actor: anonymous visitor, desktop. Given: page /signup of the qursor-qa-tester demo (demo/server.mjs, port 4318), state reset before each run. Expected outcomes: a project owned by the new user exists; the user sees that project's dashboard. Use email rdd+R-011-2@example.test and password RddPass-2! Name the project RDD project 2. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-011-2@example.test, password RddPass-2!, project RDD project 2. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:02 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:04:06) |
| Duration | `0h 1m 32s 900ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: The interaction cost of signing up and creating a first project is measured on every run Actor: anonymous visitor, desktop. Given: page /signup of the qursor-qa-tester demo (demo/server.mjs, port 4318), state reset before each run. Expected outcomes: a project owned by the new user exists; the user sees that project's dashboard. Use email rdd+R-011-2@example.test and password RddPass-2! Name the project RDD project 2. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-011-2@example.test, password RddPass-2!, project RDD project 2. Run exactly one scenario. No destructive operations outside this flow.

#### Sign up a new account and create the first project, then confirm the new user sees that project's dashboard

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 92s 900ms |

**Steps**

- Test started. Session name: QuietBoldAqua819 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill the signup form Email and Password fields with the planned new-account credentials. _(2077ms)_
- Submit the completed signup form to create the new account. _(1158ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Fill the project name field with the scenario-required project name on the first-project onboarding form. _(1312ms)_
- The new account is created and the anonymous visitor is signed in _(0ms)_
- Verification passed: the new account was created and the anonymous visitor is now signed in: the app is showing the authenticated first-project onboarding page at /projects/new with a 'Create your first project' form, not the public sign-up form with Email/Password fields _(0ms)_
- Submit the first-project form to create 'RDD project 2' and be redirected to its dashboard. _(1137ms)_
- Navigated to RDD project 2 — QA Notebook _(0ms)_
- A project named RDD project 2 exists and is owned by the newly created user _(0ms)_
- The dashboard of the RDD project 2 project is displayed to the new user _(0ms)_
- Verification passed: The signed-in user is now on the dashboard of the newly created project: the page at /projects/1 displays the project name 'RDD project 2' in its project dashboard context (heading/header or project home content), not the 'Create your first project' form. _(0ms)_

**Message**

> Verification passed: The signed-in user is now on the dashboard of the newly created project: the page at /projects/1 displays the project name 'RDD project 2' in its project dashboard context (heading/header or project home content), not the 'Create your first project' form.

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("#email", "rdd+R-011-2@example.test")
I.fillField("#password", "RddPass-2!")
I.click({"role":"button","text":"Sign up"})
I.fillField("#name", "RDD project 2")
I.seeInTitle("Create your first project")
I.see("Create your first project", "main")
I.seeElement({"role":"textbox","text":"Project name"})
I.seeElement({"role":"button","text":"Create project"})
I.dontSeeElement("input[name="email"]")
I.dontSeeElement("input[name="password"]")
I.dontSee("Password", "main")
I.click({"role":"button","text":"Create project"})
I.see("RDD project 2", "h1")
I.seeElement({"role":"heading","text":"RDD project 2"})
I.seeInTitle("RDD project 2")
I.dontSeeElement({"role":"heading","text":"Create your first project"})
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-011-2@example.test", "main")
I.dontSee("Create your first project", "main")
```
