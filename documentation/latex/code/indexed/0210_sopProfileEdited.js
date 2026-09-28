function sopProfileEdited(rerender){
  sopChanged();markDirty("review","graphs","sop","results","panel");CC_STATE.cache=null;
  renderSopHeader();if(rerender)renderSopEditor();renderSopResults();
}
