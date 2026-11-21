# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-18@example.test and password RddPass-18! Name the project RDD project 18. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-18@example.test, password RddPass-18!, project RDD project 18. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:57 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:59:23) |
| Duration | `0h 1m 44s 159ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-18@example.test and password RddPass-18! Name the project RDD project 18. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-18@example.test, password RddPass-18!, project RDD project 18. Run exactly one scenario. No destructive operations outside this flow.

#### Create an account on the signup page and then create the first project named RDD project 18, verifying the project exists and its dashboard is shown.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 104s 159ms |

**Steps**

- Test started. Session name: PrimeCompulsoryBrown814 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill email and password fields on the signup form per the test plan. _(2122ms)_
- Submit the signup form with the filled email and password to create the account. _(1149ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Enter the project name 'RDD project 18' into the Project name field on the create-first-project form. _(1318ms)_
- Submit the project creation form to create 'RDD project 18' and proceed to its dashboard. _(1149ms)_
- Navigated to RDD project 18 — QA Notebook _(0ms)_
- The account is created and the user is no longer on the anonymous signup form _(0ms)_
- A project named RDD project 18 exists and is owned by the newly registered user _(0ms)_
- The dashboard page for RDD project 18 is displayed to the user _(0ms)_
- Verified heading 'RDD project 18', 'Project dashboard', owner rdd+R-014-18@example.test _(0ms)_
- Verification passed: The current page is the dashboard of the project named 'RDD project 18': the main heading reads exactly 'RDD project 18', the page shows 'Project dashboard', and the owner line reads 'Owner: rdd+R-014-18@example.test' — confirming the project exists and is owned by the newly registered user, and that the user is signed in (not on the anonymous /signup form). _(0ms)_

**Message**

> Verification passed: The current page is the dashboard of the project named 'RDD project 18': the main heading reads exactly 'RDD project 18', the page shows 'Project dashboard', and the owner line reads 'Owner: rdd+R-014-18@example.test' — confirming the project exists and is owned by the newly registered user, and that the user is signed in (not on the anonymous /signup form).

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("Email", "rdd+R-014-18@example.test", "form[action="/signup"]")
I.fillField("Password", "RddPass-18!", "form[action="/signup"]")
I.click({"role":"button","text":"Sign up"}, "form[action="/signup"]")
I.fillField("Project name", "RDD project 18", "form[action="/projects/new"]")
I.click({"role":"button","text":"Create project"}, "form[action="/projects/new"]")
I.see("RDD project 18", "h1")
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-18@example.test", "main")
I.seeElement({"role":"heading","text":"RDD project 18"})
I.see("Owner: rdd+R-014-18@example.test", "main")
I.seeInTitle("RDD project 18")
I.see("Owner: rdd+R-014-18@example.test", "main")
```
