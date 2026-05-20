UI Strategy — Removing 'Old Price' / Discount Mentality

Objective:
Remove retail discount cues and replace them with enterprise-focused signals that communicate exclusivity, priority service, and contractual value.

Principles:

- Replace percentage discounts with tiered service labels: "Tier-1 Priority Fulfillment", "Enterprise SLA", "Project Lead Service".
- Remove strike-through former price UI elements and any 'You saved' microcopy from product cards and listing pages.
- Use subdued badges (muted gray with gold accent for priority) instead of bright sale colors.
- Emphasize procurement actions: "Request Details", "Request Bulk Quote", "Schedule Site Visit".

Implementation notes:

- CSS: hide elements with class `.old-price`, `.save-amount`, and avoid rendering `price` markup for enterprise catalog views.
- Server: on enterprise catalog endpoints, omit `price` fields or return `market_valuation: true` to let the client render the Market Quote CTA.
- Analytics: track 'Request Details' clicks, quote conversion rate, and lead quality instead of add-to-cart metrics.

UX microcopy samples:

- Instead of "Save 10%" → "Tier-1 Priority Fulfillment"
- Instead of "Limited time offer" → "Enterprise Availability: Subject to Market Valuation"
