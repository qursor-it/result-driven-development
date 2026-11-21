# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-14@example.test and password RddPass-14! Name the project RDD project 14. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-14@example.test, password RddPass-14!, project RDD project 14. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:44 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:46:49) |
| Duration | `0h 1m 44s 481ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-14@example.test and password RddPass-14! Name the project RDD project 14. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-14@example.test, password RddPass-14!, project RDD project 14. Run exactly one scenario. No destructive operations outside this flow.

#### A new anonymous visitor signs up with the specified credentials, creates their first project named RDD project 14, and lands on that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 104s 481ms |

**Steps**

- Test started. Session name: StrategicMelodicScarlet545 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- Execution error: OpenCode bridge JSON protocol failed: Unexpected end of JSON input _(0ms)_
- Previous execution error: OpenCode bridge JSON protocol failed: Unexpected end of JSON input. Investigate the current state and choose a different approach. _(0ms)_
- Fill the Email field with the scenario's signup credential. _(1439ms)_
- Fill the Password field with the signup credential. _(1267ms)_
- Submit the signup form to create the account for rdd+R-014-14@example.test. _(1138ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Fill the Project name field with the exact scenario project name RDD project 14. _(1295ms)_
- Submit the project creation form for RDD project 14. _(1125ms)_
- Navigated to RDD project 14 — QA Notebook _(0ms)_
- The account for rdd+R-014-14@example.test is created and the user is no longer on the signup page _(0ms)_
- A project named RDD project 14 exists and is owned by the newly signed-up user _(0ms)_
- The dashboard of the project RDD project 14 is displayed to the user _(0ms)_
- Verification passed: The page at /projects/1 displays the dashboard of project 'RDD project 14': the heading 'RDD project 14' is the level-1 page heading, with a descriptor 'Project dashboard' and an owner line 'Owner: rdd+R-014-14@example.test' showing the newly signed-up user as owner. _(0ms)_

**Message**

> Verification passed: The page at /projects/1 displays the dashboard of project 'RDD project 14': the heading 'RDD project 14' is the level-1 page heading, with a descriptor 'Project dashboard' and an owner line 'Owner: rdd+R-014-14@example.test' showing the newly signed-up user as owner.

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("input#email", "rdd+R-014-14@example.test")
I.fillField("input#password", "RddPass-14!")
I.click({"role":"button","text":"Sign up"}, "form[action="/signup"]")
I.fillField("input#name", "RDD project 14")
I.click({"role":"button","text":"Create project"}, "form[action="/projects/new"]")
I.see("RDD project 14", "h1")
I.seeElement({"role":"heading","text":"RDD project 14"})
I.see("Project dashboard", "main")
I.see("Owner: rdd+R-014-14@example.test", "main")
```
