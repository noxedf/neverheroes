guardPage(null, (user, profile) => {
curUser = user;
curProfile = profile;
renderTopbar(profile);
renderCreateTableBox();
loadTables();
document.getElementById('backToLobbyBtn').addEventListener('click', closeTable);
document.addEventListener('keydown', handleBoardKeydown);
document.getElementById('zoomInBtn').addEventListener('click', () => setBoardZoom(boardZoom + ZOOM_STEP));
document.getElementById('zoomOutBtn').addEventListener('click', () => setBoardZoom(boardZoom - ZOOM_STEP));
document.getElementById('zoomResetBtn').addEventListener('click', () => setBoardZoom(1));
document.getElementById('zoomFitBtn').addEventListener('click', fitBoardToScreen);
document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreenBoard);
initCursorFollowTracking();
document.getElementById('sheetModalClose').addEventListener('click', closeSheetModal);
document.getElementById('sheetModalOverlay').addEventListener('click', (e) => {
if (e.target.id === 'sheetModalOverlay') closeSheetModal();
});
renderTableDiceQuickRow();
renderTableDiceLog();
initDiceLogToggle();
initSidePanelAccordion();
initSubPanelAccordion();
initSidebarToggles();
document.getElementById('diceRollBtn').addEventListener('click', doTableRoll);
document.getElementById('diceCmdInput').addEventListener('keydown', (e) => {
if (e.key === 'Enter') { e.preventDefault(); doTableRoll(); }
});
document.getElementById('diceTargetSelect').addEventListener('change', updateDiceTargetUiState);
document.getElementById('diceBodyPartChecks').addEventListener('change', updateDiceTargetUiState);
const tlSearchInput = document.getElementById('tokenListSearchInput');
if (tlSearchInput) tlSearchInput.addEventListener('input', () => {
clearTimeout(tlSearchDebounceTimer);
tlSearchDebounceTimer = setTimeout(() => {
tokenListSearch = tlSearchInput.value;
renderTokenListPanel();
}, 150);
});
const tlSortSelect = document.getElementById('tokenListSortSelect');
if (tlSortSelect) tlSortSelect.addEventListener('change', () => {
tokenListSort = tlSortSelect.value;
renderTokenListPanel();
});
});
