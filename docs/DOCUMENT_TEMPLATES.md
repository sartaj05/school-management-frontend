# Document templates

Documents supports tenant-scoped metadata templates for certificates, report
cards and ID cards. School Admin users can create and activate templates from
the Documents page. Teachers can view active templates, but cannot edit them.

The API stores safe JSON settings rather than executable HTML. Existing
authorized report-card and export endpoints remain responsible for rendering
and downloading documents.
