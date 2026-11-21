# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-16@example.test and password RddPass-16! Name the project RDD project 16. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-16@example.test, password RddPass-16!, project RDD project 16. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:50 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:53:38) |
| Duration | `0h 2m 49s 748ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-16@example.test and password RddPass-16! Name the project RDD project 16. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-16@example.test, password RddPass-16!, project RDD project 16. Run exactly one scenario. No destructive operations outside this flow.

#### Sign up as a new user with the specified email and password, then create the first project named RDD project 16 and reach its dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 169s 748ms |

**Steps**

- Test started. Session name: FragilePuzzledBlue993 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Filling the Email field on the signup form with the disposable address from the plan. _(1476ms)_
- Filling the Password field with the disposable password from the plan. _(1254ms)_
- Submitting the signup form now that Email and Password are filled. _(1135ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Signup succeeded, now on /projects/new onboarding _(0ms)_
- New account created and user is signed in _(0ms)_
- Entering the project name RDD project 16 into the first-project creation form. _(1284ms)_
- Submitting the first-project creation form to persist RDD project 16 and enter its dashboard. _(1175ms)_
- Navigated to RDD project 16 — QA Notebook _(0ms)_
- Verification passed: On the page at /projects/1, the main content heading reads 'RDD project 16' and the subtitle reads 'Project dashboard' — confirming the dashboard of the newly created project is displayed. _(0ms)_
- The new account is created and the user is signed in _(0ms)_
- A project named RDD project 16 is created and remains after the project creation form closes _(0ms)_
- The dashboard for the project RDD project 16 is displayed to the user _(0ms)_
- The project RDD project 16 is shown as belonging to the signed-in user _(0ms)_

**Message**

> The project RDD project 16 is shown as belonging to the signed-in user

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("Email", "rdd+R-014-16@example.test", "form[action="/signup"]")
I.fillField("Password", "RddPass-16!", "form[action="/signup"]")
I.click({"role":"button","text":"Sign up"}, "form[action="/signup"]")
I.fillField("Project name", "RDD project 16", "form[action="/projects/new"]")
I.click({"role":"button","text":"Create project"}, "form[action="/projects/new"]")
I.see("RDD project 16", "main h1")
I.see("Project dashboard", "main p")
I.seeInTitle("RDD project 16")
I.dontSeeElement({"role":"textbox","text":"Project name"})
I.dontSeeElement({"role":"button","text":"Create project"})
I.see("RDD project 16", "h1")
I.dontSeeInSource("Project name")
I.dontSeeInSource("Create project")
I.seeInTitle("RDD project 16")
I.dontSeeElement({"role":"form"})
I.dontSeeElement({"role":"button","text":"Create project"})
I.see("RDD project 16", "main")
I.see("Owner: rdd+R-014-16@example.test", "main")
I.seeInSource("Owner: rdd+R-014-16@example.test")
I.see("RDD project 16", "main")
I.see("Owner: rdd+R-014-16@example.test", "main")
```
