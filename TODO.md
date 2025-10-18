# TODO: Fix Invisible Action Buttons in Blog App

## Tasks
- [x] Modify action buttons in Table.tsx to add subtle background for visibility
- [x] Test the application to ensure buttons are visible and functional
- [x] Verify design consistency with the dark theme

## Details
The View, Edit, and Delete buttons in the table are using ghost variant buttons which are transparent on the dark background, making them invisible. Need to add bg-white/10 or similar to make them always visible.
