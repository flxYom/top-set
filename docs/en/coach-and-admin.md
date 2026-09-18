> **English** · [Français](../fr/coach-et-admin.md)

# Coach and administration

Part of the [Top Set documentation](../../README.md#documentation).

## The coach link

The only opening in the logbook wall, and it is four `SELECT` policies added
*beside* the existing ones rather than modifying them: two permissive policies
add up, so the owner keeps every right and the coach gets read access only.

**The link exists only if both sides acted.** The coach generates an 8-character
code (alphabet without `O`/`0` or `I`/`1` — it gets read out loud), the client
enters it, the coach accepts. A hand-typed nickname would hand a whole logbook to
a stranger on one typo; a code is either right or wrong, never almost.

**What a coach can do:** read their client's sessions, exercises, sets and
remembered exercises, and see their nickname.
**What they cannot:** change or delete anything, see the email address, the
consent records or the feedback. There is no function for it.

**One active coach** per person, enforced by a partial unique index rather than
an application rule someone could forget. **Revocable from both sides**, taking
effect immediately: the policy re-reads the status on every query, so there is no
token to expire and no cache to clear. The client's **consent** is dated and
versioned in `consentements` at the moment they make the request.

### The design point that matters

`tirer_jours_de(client)` is `security invoker` and **checks no permission at
all**. It asks for that client's sessions and RLS answers. With no active link
the result is empty — not because an `if` decided so, but because the database
has nothing to show. There is no check to forget in that function, and a test
asserts it never becomes `security definer`.

47 tests cover this mechanism alone: before the link, while pending, after
acceptance, what the coach cannot do, the third party who is neither side, the
rejected second coach, revocation, ending the coaching, and `anon` throughout.

### The coach ↔ client conversation

A table of its own, `messages_coach`, rather than a reuse of support messaging:
there, the other side is "the team", the same for everyone; here it is two
accounts, and the right to write is read **from the link**, not from a role.

- **Writing** requires an *active* link, and the declared author must match the
  real side: a client cannot sign as coach, a coach cannot write to someone they
  do not coach, and nobody can create a thread between two strangers.
- **Reading**: the client keeps the history even after cutting access — it is
  their conversation. The coach loses read access on the break, as with the
  logbook. The administrator does not see it.
- **Rewriting** is impossible: the update privilege is limited to the `lu`
  column. **Deleting** too: there is no `delete` policy.
- **Marking as read** only applies to what the other side wrote, and a message
  leaves unread and dated by the database: inserts stop at `coach_id`,
  `client_id`, `auteur` and `corps`. The support thread follows the same rule.

---

## Feedback and administration

### Feedback

A "Nous faire un retour" link in the footer opens a sheet: three kinds — `bug`,
`idee`, `question` — a body capped at 4,000 characters, and the list of what you
already sent with its status. An account is required: that is what makes a reply
possible, and what keeps a bot from filling the table.

Sent along with the message: the current view, the screen size, the user agent
truncated to 160 characters, and a "running as a PWA" flag. Enough to reproduce a
bug, nothing from the logbook. The screen says so before you send.

**Anti-spam** (18 September 2026). Every send can trigger an email, so a script
with a valid account could flood the queue and the inbox. A `before insert`
trigger (`plafond_envois`) caps it per hour: 10 feedbacks per account, 30
messages from a member to the team, 60 messages per direction in a coach thread.
The team is not capped. Past the cap the database refuses, and the app shows
"too many sends in a short time — try again in an hour".

The bounds live in the database, not in the form — `check` constraints on the
kind, the status, the body length and the context size. You do not defend a table
with JavaScript.

A trigger, `accuser_retour()`, copies every feedback into its author's thread,
then adds an acknowledgement signed `systeme` rather than `admin` — nobody has
read it yet. No policy lets anyone write a `systeme` message, administrator
included: only the trigger can, which is what makes it credible.

### Messaging

One thread per member, the same from both sides: a message written by the
administrator still carries the member's `user_id`, otherwise there would be no
conversation, only two lists. **The insert policy checks that the declared
author matches the caller's real role** — a member cannot insert a message
signed `admin`, even by crafting the request by hand.

Support and coaching each had their own thread, in two different sheets, and a
ticket reached the admin space with nothing to reply with. There is now **one
inbox**, behind the header bubble. Two tables underneath, because the right to
write is decided differently — a role on one side, a link on the other — but a
single door on screen:

| Who is looking | Table | With whom |
|---|---|---|
| a member | `messages_support` | the Top Set team |
| the team | `messages_support` | every member who wrote |
| a client | `messages_coach` | their coach |
| a coach | `messages_coach` | each of their clients |

The team can write to anyone from the admin space (**ÉCRIRE**, **RÉPONDRE**).
**Two strangers cannot write to each other**, and it is the database that
refuses, not the screen. New messages are fetched every 10 s while a
conversation is open and visible, every 30 s in the inbox, never while the tab
is hidden. The badge is two `head:true` counts — numbers, not hundreds of
messages — at most once every 8 s, and zero on error.

**The count waits for the profile.** It used to run before `toucher_profil()`
answered, so the administrator was counted as a member, on their own support
thread — the one holding their test feedback, which their inbox never shows and
nothing therefore marked read. The badge stayed lit on a message nobody could
open, and the real count, held back by the 8 s limit, arrived a minute later.
`profilConnu()` now waits for the role, opening the inbox recounts, and a token
stops a count started before a read from relighting the badge after it.
Opening a member's thread also marks that member's message and feedback
notifications read; sign-ups and coaching requests stay.

### The admin space

Restricted to the `admin` role. Ten counters (sign-ups, new and active at 7 and
30 days, sessions, sets, pending feedback, unread messages, notifications), the
notifications, a way into the inbox, the feedback list — each with
**RÉPONDRE**, **MARQUER LU** and **TRAITÉ** — and the member list sorted by last
visit, each with **ÉCRIRE**.

**What it does not show:** no email address, and no logbook row. The four
functions return aggregates only. An administrator sees *how many* sessions are
logged, never what is in them — a direct `select` on `seances` is denied to them
like to anyone else, and a test asserts it on every run.

The role check lives **inside the functions**, as their first statement, not in
the interface: hiding a button has never protected anything.

### Granting yourself the admin role

There is deliberately no function for it. It is done once, by hand, after opening
the app at least once so the profile row exists — Supabase → SQL Editor:

```sql
update public.profils set role = 'admin'
where user_id = (select id from auth.users where email = 'you@example.com');
```
