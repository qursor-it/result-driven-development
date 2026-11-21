# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-1@example.test and password RddPass-1! Name the project RDD project 1. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-1@example.test, password RddPass-1!, project RDD project 1. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:09 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:11:54) |
| Duration | `0h 2m 5s 464ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-1@example.test and password RddPass-1! Name the project RDD project 1. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-1@example.test, password RddPass-1!, project RDD project 1. Run exactly one scenario. No destructive operations outside this flow.

#### A new anonymous visitor signs up with a new account and creates their first project named RDD project 1, then lands on that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 125s 464ms |

**Steps**

- Test started. Session name: EnthusiasticSystematicLavender252 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill the signup form email and password fields as planned. _(2085ms)_
- Submit the sign up form with the filled credentials. _(1165ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Verification passed: The sign up form on /signup contains the Email field filled with 'rdd+R-014-1@example.test' and the Password field filled (masked characters) _(0ms)_
- Fill the first-project creation form with the project name RDD project 1. _(1274ms)_
- Submit the first-project creation form now that 'RDD project 1' is entered. _(1200ms)_
- Navigated to RDD project 1 — QA Notebook _(0ms)_
- The account is created and the visitor is no longer on the sign up form _(0ms)_
- A project named RDD project 1 exists and is owned by the signed-up user _(0ms)_
- The dashboard page for RDD project 1 is displayed _(0ms)_
- Verification passed: On the current page /projects/1, the sign up form is no longer displayed; the main content shows the dashboard for the newly created project with heading 'RDD project 1', a 'Project dashboard' subtitle, and an owner line 'Owner: rdd+R-014-1@example.test'. _(0ms)_

**Message**

> Verification passed: On the current page /projects/1, the sign up form is no longer displayed; the main content shows the dashboard for the newly created project with heading 'RDD project 1', a 'Project dashboard' subtitle, and an owner line 'Owner: rdd+R-014-1@example.test'.

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("Email", "rdd+R-014-1@example.test")
I.fillField("Password", "RddPass-1!")
I.seeInField("Email", "rdd+R-014-1@example.test")
I.seeInField("Password", "RddPass-1!")
I.seeInField("input[name="email"]", "rdd+R-014-1@example.test")
I.seeInField("input[name="password"]", "RddPass-1!")
I.seeInField("#email", "rdd+R-014-1@example.test")
I.dontSeeInField("#password", )
I.seeInField("#password", "RddPass-1!")
I.click({"role":"button","text":"Sign up"}, "form[action="/signup"]")
I.fillField("Project name", "RDD project 1")
I.click({"role":"button","text":"Create project"}, "form[action="/projects/new"]")
I.dontSeeElement("form")
I.see("RDD project 1", "main")
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-1@example.test", "main")
I.seeElement({"role":"heading","text":"RDD project 1"})
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-1@example.test", "main")
I.dontSeeElement("form")
I.seeInTitle("RDD project 1")
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-1@example.test", "main")
I.dontSeeElement("form")
```
