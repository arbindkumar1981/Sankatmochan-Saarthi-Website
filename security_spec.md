# Security Specification - Saarthi by Sankatmochan

## 1. Data Invariants
- Admin operations (publishing, editing, approving curriculum, tests, learning contents, managing notices) require verified admin role checked against the `/admins/{uid}` collection or bootstrapped admin `principal.a.kumar@gmail.com`.
- Students can only read published curriculum, approved learning contents, approved videos, published tests, and notices targeted to all or to their specific class/UID.
- Student test results (`/test_results/{resultId}`) and mistake book entries (`/mistakes/{mistakeId}`) can ONLY be read and created by the authenticated owner student (`request.auth.uid == resource.data.studentUid`), preventing peer snooping.
- User profiles (`/users/{userId}`) can only be written by the authenticated user himself/herself, and the `role` cannot be self-escalated to `admin` unless verified against `/admins/{uid}`.
- Contact enquiries (`/enquiries/{enquiryId}`) can be submitted by anyone or any signed-in user, but read/reply access is strictly restricted to Admins.
- All IDs must be validated with `isValidId(id)` conforming to string length `<= 128` and matching alphanumeric/hyphen characters.

## 2. The Dirty Dozen Payloads
1. **Admin Escalation on User Register**: An unauthenticated or regular student attempts to write `{ role: "admin" }` to `/users/{uid}`. Expected: PERMISSION_DENIED.
2. **Student Result Snooping**: User A attempts to list or read `/test_results/{resultId}` belonging to User B. Expected: PERMISSION_DENIED.
3. **Ghost Field Poisoning**: Malicious student attempts to update `/users/{uid}` with `{ isSuperAdmin: true, shadowRole: "godmode" }`. Expected: PERMISSION_DENIED.
4. **Curriculum Tampering by Student**: Regular student attempts to write or delete a `/curriculum_nodes/{nodeId}`. Expected: PERMISSION_DENIED.
5. **Notice Hijacking**: Non-admin user attempts to create a fake notice in `/notices/{noticeId}`. Expected: PERMISSION_DENIED.
6. **Unapproved Content Scraping**: Anonymous user attempts to read unapproved drafts in `/learning_contents/{contentId}` where `approved == false`. Expected: PERMISSION_DENIED.
7. **Mistake Record Theft**: User A attempts to read or mutate `/mistakes/{id}` belonging to User B. Expected: PERMISSION_DENIED.
8. **Enquiry Inbox Snooping**: Student attempts to list `/enquiries` to see other students' contact messages and phone numbers. Expected: PERMISSION_DENIED.
9. **Fake Test Result Score Injection**: Unauthenticated actor attempts to write a score directly to `/test_results/{id}` without `request.auth`. Expected: PERMISSION_DENIED.
10. **Huge ID Buffer Overflow Attack**: Client attempts to create document with 2000-character junk string as `nodeId`. Expected: PERMISSION_DENIED (blocked by `isValidId`).
11. **Email Spoof Attack**: Attacker creates account claiming `principal.a.kumar@gmail.com` with `email_verified == false`. Expected: PERMISSION_DENIED.
12. **Content Poisoning**: Non-admin attempts to publish an unverified YouTube video to `/youtube_videos/{videoId}`. Expected: PERMISSION_DENIED.
