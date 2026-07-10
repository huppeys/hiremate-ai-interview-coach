\# HireMate Database Schema



HireMate uses Supabase PostgreSQL for persistent data storage.



\## users



Stores registered user accounts and profile information.



| Column | Type | Description |

|---|---|---|

| id | uuid | Primary key for the user |

| name | text | User's full name |

| email | text | Unique email address |

| password | text | Bcrypt-hashed password |

| education\_level | text | User's education level |

| desired\_role | text | User's target role |

| industry | text | User's target industry |

| created\_at | timestamp | Account creation time |



\## sessions



Stores interview practice sessions.



| Column | Type | Description |

|---|---|---|

| id | integer | Primary key for the session |

| user\_id | uuid | References the user who owns the session |

| interview\_type | text | Behavioral, technical, or mixed |

| target\_role | text | Role the user is preparing for |

| industry | text | Target industry |

| experience\_level | text | Intern, entry, mid, or senior |

| resume\_text | text | Extracted resume text |

| status | text | configuring, ready, in-progress, paused, abandoned, or completed |

| questions | json/jsonb | Stored session question data |

| score | numeric | Session score |

| paused\_at | timestamp | Time the session was paused |

| abandoned\_at | timestamp | Time the session was abandoned |

| partial | boolean | Indicates an incomplete session |

| created\_at | timestamp | Session creation time |



\## questions



Stores interview questions associated with sessions.



| Column | Type | Description |

|---|---|---|

| id | integer | Primary key for the question |

| session\_id | integer | References sessions.id |

| question\_text | text | Interview question |

| question\_type | text | Behavioral or technical |

| created\_at | timestamp | Question creation time |



\## responses



Stores user responses to interview questions.



| Column | Type | Description |

|---|---|---|

| id | integer | Internal primary key |

| response\_id | uuid | Public response identifier |

| session\_id | integer | References sessions.id |

| question\_id | integer | References questions.id |

| user\_id | uuid | User who submitted the response |

| response\_text | text | Written or transcribed response |

| response\_type | text | Text or voice response |

| audio\_url | text | Optional stored audio URL |

| submitted\_at | timestamp | Response submission time |



\## Relationships



\- One user can own many sessions.

\- One session can contain many questions.

\- One session can contain many responses.

\- Each response belongs to one session.

\- Each response links to one question through `question\_id`.



\## Row Level Security



Row Level Security is enabled on the `responses` table.



The following policies are configured:



\- Users can read responses that belong to their own sessions.

\- Users can insert responses into their own sessions.

\- Users can update responses that belong to their own sessions.

\- Users can delete responses that belong to their own sessions.



Ownership is determined by checking that:



```sql

sessions.user\_id = auth.uid()

