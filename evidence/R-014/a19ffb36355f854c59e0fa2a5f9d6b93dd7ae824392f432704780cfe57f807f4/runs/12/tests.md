# Explorbot session /signup focus: "A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-12@example.test and password RddPass-12! Name the project RDD project 12. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-12@example.test, password RddPass-12!, project RDD project 12. Run exactly one scenario. No destructive operations outside this flow." at 2026-11-21T06:38 — FINISHED

## Summary

| Total | Passed | Failed | Skipped | Todo | Flaky |
| ----- | ------ | ------ | ------- | ---- | ----- |
| 1 | 1 | 0 | 0 | 0 | 0 |

## Run Metadata

| Key | Value |
| --- | ----- |
| Status | finished |
| Started | (21/11/2026 07:40:51) |
| Duration | `0h 2m 22s 265ms` |
| Parallel | No parallel info |

## Configuration

| Key | Value |
| --- | ----- |
| `exploratory` | true |

## Tests

### Suite: A new user creates their first project without help Actor: anonymous visitor, desktop and mobile. Given: page /signup, no existing account. Expected outcomes: a project owned by the user exists; the user sees that project's dashboard. Use email rdd+R-014-12@example.test and password RddPass-12! Name the project RDD project 12. The application logic restricts these values, so type them exactly as given, character for character, with no session name, suffix, marker or any other change: email rdd+R-014-12@example.test, password RddPass-12!, project RDD project 12. Run exactly one scenario. No destructive operations outside this flow.

#### An anonymous visitor signs up with the exact provided email and password, then creates the first project named RDD project 12 and reaches that project's dashboard.

| Key | Value |
| --- | ----- |
| Status | passed |
| Duration | 142s 265ms |

**Steps**

- Test started. Session name: ShortCrowdedEmerald106 _(0ms)_
- Navigated to Sign up — QA Notebook _(0ms)_
- &gt; PLAN: fill signup email, password, submit once _(0ms)_
- Signup page has Email, Password, Sign up button only _(0ms)_
- Fill the signup email field with the provided QA email address. _(1447ms)_
- Fill the signup password field with the provided password. _(1528ms)_
- Submit the signup form once to create the account. _(1153ms)_
- Navigated to Create your first project — QA Notebook _(0ms)_
- Signed up, redirected to /projects/new _(0ms)_
- The account is created for the user without any help flow _(0ms)_
- Fill the project name field with the exact project name RDD project 12. _(1287ms)_
- Submit the project creation form once to create the project RDD project 12. _(1140ms)_
- Navigated to RDD project 12 — QA Notebook _(0ms)_
- &gt; ASSERT: h1 'RDD project 12' on /projects/1 _(0ms)_
- A project owned by the user exists with the name RDD project 12 _(0ms)_
- Owner line shows rdd+R-014-12@example.test _(0ms)_
- The user sees the dashboard of the RDD project 12 project _(0ms)_
- Verification passed: On /projects/1, the page is the dashboard of a single project: the main heading (h1) is exactly 'RDD project 12' and a subtitle reads 'Project dashboard'. The page is not the create-project form (/projects/new) and not a project list. _(0ms)_

**Message**

> Verification passed: On /projects/1, the page is the dashboard of a single project: the main heading (h1) is exactly 'RDD project 12' and a subtitle reads 'Project dashboard'. The page is not the create-project form (/projects/new) and not a project list.

**Stack Trace**

```
################[ Logs ]################
I.amOnPage("http://127.0.0.1:4318/signup")
I.fillField("form input[name="email"]", "rdd+R-014-12@example.test")
I.fillField("form input[name="password"]", "RddPass-12!")
I.click({"role":"button","text":"Sign up"}, "main")
I.fillField("input[name="name"]", "RDD project 12")
I.click({"role":"button","text":"Create project"}, "main")
I.see("RDD project 12", "h1")
I.see("Project dashboard", "main")
I.seeElement({"role":"heading","text":"RDD project 12"})
I.see("Project dashboard", "main p")
I.seeInTitle("RDD project 12")
I.see("Project dashboard", "main")
I.see("RDD project 12", "main")
I.see("Owner: rdd+R-014-12@example.test", "main")
I.seeElement("//main//p[normalize-space(.)="Owner: rdd+R-014-12@example.test"]")
I.seeInTitle("RDD project 12")
I.see("Owner: rdd+R-014-12@example.test", "main")
```
