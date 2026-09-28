function reviewEventsWithoutIntegrity(){
  return (reviewForensicEvents()||[]).filter(e=>String(e.area||"").toLowerCase()!=="integrity");
}
