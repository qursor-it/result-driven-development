# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-10@example.test and password RddPass-10! Name the project RDD project 10. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-10@example.test, password RddPass-10!, project RDD project 10. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:33 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:35:26) |
| Duration | `0h 2m 6s 597ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-10@example.test and password RddPass-10! Name the project RDD project 10. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-10@example.test, password RddPass-10!, project RDD project 10. Run exactly one scenario. No destructive operations outside this flow.

#### An anonymous visitor signs up with the given email and password and creates a first project named RDD project 10, ending on that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 126s 597ms |

**Steps**

- Test started. Session name: WitteringNewBrown135 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Fill the Email field with the scenario test email address. _(1464ms)_
- Fill the Password field with the scenario test password. _(1261ms)_
- Submit the signup form to create the new account. _(1147ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Fill the Project name field with the required project name RDD project 10. _(1278ms)_
- Submit the project creation form to create RDD project 10 and proceed to its dashboard. _(1131ms)_
- Navigated to RDD project 10 — QA Notebook _(0ms)_
- Verification passed: The dashboard for the project named 'RDD project 10' is displayed, showing the project name on the page and proving the project was created and is now open. _(0ms)_
- The account is created and the signup form is no longer shown _(0ms)_
- The new user is presented with a project creation step without needing help _(0ms)_
- A project named RDD project 10 exists and is owned by the signed-in user _(0ms)_
- The dashboard for the RDD project 10 project is displayed _(0ms)_

**Message**

> The dashboard for the RDD project 10 project is displayed

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("input[name="email"]", "rdd+R-014-10@example.test")
I.fillField("input[name="password"]", "RddPass-10!")
I.click({"role":"button","text":"Sign up"})
I.fillField("input[name="name"]", "RDD project 10")
I.click({"role":"button","text":"Create project"})
I.see("RDD project 10", "main h1")
I.seeInTitle("RDD project 10")
I.seeElement({"role":"heading","text":"RDD project 10"})
```
