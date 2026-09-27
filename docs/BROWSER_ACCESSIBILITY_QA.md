# Browser and accessibility release gate

Automated Node tests verify the dialog and global accessibility contracts, but
the final release gate must be completed in a real browser:

1. Run `npm run lint`, `npm test` and `npm run build`.
2. Use keyboard-only navigation from login through dashboard, admissions,
   finance and settings. Every focused control must be visible.
3. Open and close confirmation, plan, image and admissions follow-up dialogs
   with keyboard controls. Confirm focus returns to the triggering control.
4. Run axe or Lighthouse accessibility checks at desktop and mobile widths.
5. Verify Hindi labels do not overflow sidebars, tables or dialogs.
6. Test Chrome and Edge with a screen reader before client delivery.
