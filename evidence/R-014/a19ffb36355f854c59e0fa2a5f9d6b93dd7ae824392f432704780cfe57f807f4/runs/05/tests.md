# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-5@example.test and password RddPass-5! Name the project RDD project 5. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-5@example.test, password RddPass-5!, project RDD project 5. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:21 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:23:08) |
| Duration | `0h 1m 57s 539ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-5@example.test and password RddPass-5! Name the project RDD project 5. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-5@example.test, password RddPass-5!, project RDD project 5. Run exactly one scenario. No destructive operations outside this flow.

#### An anonymous visitor signs up with the given email and password, creates the first project named RDD project 5, and reaches that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 117s 539ms |

**Steps**

- Test started. Session name: OutrageousMoralCyan488 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill the Email field on the signup form with the scenario's test email. _(1659ms)_
- Fill the Password field with the scenario's test password. _(1307ms)_
- Submit the signup form after filling Email and Password. _(1192ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Fill the Project name field with the scenario's required first project name RDD project 5. _(1632ms)_
- Submit the first-project creation form with the filled name RDD project 5. _(1150ms)_
- Navigated to RDD project 5 — QA Notebook _(0ms)_
- The sign up form is accepted and the user is no longer on the empty sign up form _(0ms)_
- A project named RDD project 5 exists and is owned by the signed up user _(0ms)_
- The dashboard of the RDD project 5 project is displayed to the user _(0ms)_
- Signup redirect to /projects/new then project created at /projects/1 _(0ms)_
- Verification passed: In the main content area the heading 'RDD project 5' is visible and the text 'Project dashboard' is shown _(0ms)_

**Message**

> Verification passed: In the main content area the heading 'RDD project 5' is visible and the text 'Project dashboard' is shown

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField({"role":"textbox","text":"Email"}, "rdd+R-014-5@example.test", "[action="/signup"]")
I.fillField({"role":"textbox","text":"Password"}, "RddPass-5!", "[action="/signup"]")
I.click({"role":"button","text":"Sign up"}, "[action="/signup"]")
I.fillField({"role":"textbox","text":"Project name"}, "RDD project 5", "form[action="/projects/new"]")
I.click({"role":"button","text":"Create project"}, "form[action="/projects/new"]")
I.see("RDD project 5", "main h1")
I.see("Project dashboard", "main")
I.see("RDD project 5", "main")
I.see("Project dashboard", "main > p")
```
