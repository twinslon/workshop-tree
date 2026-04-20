let modInfo = {
	name: "The Workshop Tree",
	author: "Pencho",
	pointsName: "scraps",
	modFiles: ["layers.js", "tree.js"],

	discordName: "",
	discordLink: "",
	initialStartPoints: new Decimal(10),
	offlineLimit: 1,
}

let VERSION = {
	num: "0.3",
	name: "Power Grid",
}

let changelog = `<h1>Changelog:</h1><br>
	<h3>v0.3 - Power Grid</h3><br>
		- Added Power and Robotics layers after Factories.<br>
		- Added new automation for Machines, Blueprints, and Factories.<br>
		- Moved the endgame target into Robotics.<br><br>
	<h3>v0.2.1 - Factory Tuning</h3><br>
		- Removed the forced Parts auto-reset loop from Night Shift.<br>
		- Slowed Factory costs and reduced the global Factory multiplier so the post-Factory game lasts longer.<br><br>
	<h3>v0.2 - Automation Floor</h3><br>
		- Added bulk buying, more Parts and Machines upgrades, Machine automation, extra Blueprint contracts, and Factory upgrades.<br>
		- Improved Logistics route scaling and mid-game pacing.<br><br>
	<h3>v0.1 - First Assembly</h3><br>
		- Added Parts, Machines, Blueprints, Factories, and Logistics.<br>
		- Added starter upgrades, buyables, milestones, and challenges.`

let winText = `The workshop hums on its own. You built a factory that can keep improving without you.`

var doNotCallTheseFunctionsEveryTick = []

function getStartPoints(){
    return new Decimal(modInfo.initialStartPoints)
}

function canGenPoints(){
	return true
}

function getPointGen() {
	if (!canGenPoints()) return new Decimal(0)

	let gain = new Decimal(1)

	if (inChallenge("b", 11)) gain = gain.div(10)
	if (hasUpgrade("p", 12)) gain = gain.times(upgradeEffect("p", 12))
	if (hasUpgrade("p", 13)) gain = gain.times(2)
	if (hasUpgrade("p", 24)) gain = gain.times(upgradeEffect("p", 24))
	if (hasUpgrade("m", 11) && !inChallenge("b", 12)) gain = gain.times(layers.m.effect())
	if (hasUpgrade("m", 13)) gain = gain.times(upgradeEffect("m", 13))
	if (hasUpgrade("b", 12)) gain = gain.times(upgradeEffect("b", 12))
	if (hasChallenge("b", 21)) gain = gain.times(challengeEffect("b", 21))
	if (player.l && player.l.focus == "scraps") gain = gain.times(clickableEffect("l", 11))
	if (player.f && player.f.unlocked) gain = gain.times(layers.f.effect())
	if (player.w && player.w.unlocked) gain = gain.times(layers.w.effect())
	if (player.r && player.r.unlocked) gain = gain.times(layers.r.effect())

	return gain
}

function addedPlayerData() { return {
}}

var displayThings = [
	function() {
		if (player.l && player.l.focus) return "Logistics focus: " + player.l.focus
	},
	function() {
		if (hasUpgrade("m", 25)) return "Machines are fabricating " + format(tmp.p.resetGain.times(0.35)) + " Parts/sec"
		if (hasUpgrade("m", 24)) return "Machines are fabricating " + format(tmp.p.resetGain.times(0.1)) + " Parts/sec"
	},
]

function isEndgame() {
	return player.r && player.r.points.gte(5)
}

var backgroundStyle = {
}

function maxTickLength() {
	return 3600
}

function fixOldSave(oldVersion){
}
