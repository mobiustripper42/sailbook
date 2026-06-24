# Sessions branch (DEC-014)

Orphan branch. Each project session writes one file here via the `.sessions-worktree/`
worktree — `/its-alive` opens it, `/kill-this` appends task blocks, `/its-dead` closes it.
The main checkout never moves; session-log commits land here, not on `main`.
