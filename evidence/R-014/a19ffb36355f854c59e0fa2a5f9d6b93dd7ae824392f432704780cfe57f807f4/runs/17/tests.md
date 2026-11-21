# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-17@example.test and password RddPass-17! Name the project RDD project 17. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-17@example.test, password RddPass-17!, project RDD project 17. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:54 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:56:12) |
| Duration | `0h 1m 40s 18ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-17@example.test and password RddPass-17! Name the project RDD project 17. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-17@example.test, password RddPass-17!, project RDD project 17. Run exactly one scenario. No destructive operations outside this flow.

#### A new user signs up with the provided credentials and creates their first project named RDD project 17, ending on that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 100s 18ms |

**Steps**

- Test started. Session name: SupposedGleamingGray214 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill the sign-up Email and Password fields with the planned disposable credentials before submitting. _(2240ms)_
- Submit the sign-up form with the filled credentials. _(1160ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Fill the first-project form with the exact project name from the scenario. _(1290ms)_
- Submit the first-project form to create 'RDD project 17' and land on its dashboard. _(1174ms)_
- Navigated to RDD project 17 — QA Notebook _(0ms)_
- Signed up as rdd+R-014-17@example.test, left /signup _(0ms)_
- The sign-up page is left and an authenticated application page is displayed _(0ms)_
- Created project RDD project 17 at /projects/1 _(0ms)_
- A project named RDD project 17 exists and is visible as owned by the signed-up user _(0ms)_
- The dashboard of the project RDD project 17 is displayed to the user _(0ms)_
- Verification passed: The page at /projects/1 is the dashboard of the project named 'RDD project 17': the level-1 heading reads exactly 'RDD project 17', the subtitle text says 'Project dashboard', and the Owner line shows the signed-up account rdd+R-014-17@example.test. The sign-up form is no longer displayed. _(0ms)_

**Message**

> Verification passed: The page at /projects/1 is the dashboard of the project named 'RDD project 17': the level-1 heading reads exactly 'RDD project 17', the subtitle text says 'Project dashboard', and the Owner line shows the signed-up account rdd+R-014-17@example.test. The sign-up form is no longer displayed.

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("#email", "rdd+R-014-17@example.test")
I.fillField("#password", "RddPass-17!")
I.click({"role":"button","text":"Sign up"}, "form[action="/signup"]")
I.fillField("#name", "RDD project 17")
I.click({"role":"button","text":"Create project"}, "form[action="/projects/new"]")
I.see("RDD project 17", "h1")
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-17@example.test", "main")
I.seeInTitle("RDD project 17")
I.see("Project dashboard", "main")
I.dontSeeElement("main form")
I.dontSeeElement("input[type="email"]")
I.dontSeeElement("input[type="password"]")
```
