var path = require('path'),
    fs = require('fs');

var mimeTypes = '# This file maps Internet media types to unique file extension(s).\r\n\
# Although created for httpd, this file is used by many software systems\r\n\
# and has been placed in the public domain for unlimited redisribution.\r\n\
#\r\n\
# The table below contains both registered and (common) unregistered types.\r\n\
# A type that has no unique extension can be ignored -- they are listed\r\n\
# here to guide configurations toward known types and to make it easier to\r\n\
# identify "new" types.  File extensions are also commonly used to indicate\r\n\
# content languages and encodings, so choose them carefully.\r\n\
#\r\n\
# Internet media types should be registered as described in RFC 4288.\r\n\
# The registry is at <http://www.iana.org/assignments/media-types/>.\r\n\
#\r\n\
# MIME type (lowercased)			Extensions\r\n\
# ============================================	==========\r\n\
# application/1d-interleaved-parityfec\r\n\
# application/3gpp-ims+xml\r\n\
# application/activemessage\r\n\
application/andrew-inset			ez\r\n\
# application/applefile\r\n\
application/applixware				aw\r\n\
application/atom+xml				atom\r\n\
application/atomcat+xml				atomcat\r\n\
# application/atomicmail\r\n\
application/atomsvc+xml				atomsvc\r\n\
# application/auth-policy+xml\r\n\
# application/batch-smtp\r\n\
# application/beep+xml\r\n\
# application/calendar+xml\r\n\
# application/cals-1840\r\n\
# application/ccmp+xml\r\n\
application/ccxml+xml				ccxml\r\n\
application/cdmi-capability			cdmia\r\n\
application/cdmi-container			cdmic\r\n\
application/cdmi-domain				cdmid\r\n\
application/cdmi-object				cdmio\r\n\
application/cdmi-queue				cdmiq\r\n\
# application/cea-2018+xml\r\n\
# application/cellml+xml\r\n\
# application/cfw\r\n\
# application/cnrp+xml\r\n\
# application/commonground\r\n\
# application/conference-info+xml\r\n\
# application/cpl+xml\r\n\
# application/csta+xml\r\n\
# application/cstadata+xml\r\n\
application/cu-seeme				cu\r\n\
# application/cybercash\r\n\
application/davmount+xml			davmount\r\n\
# application/dca-rft\r\n\
# application/dec-dx\r\n\
# application/dialog-info+xml\r\n\
# application/dicom\r\n\
# application/dns\r\n\
# application/dskpp+xml\r\n\
application/dssc+der				dssc\r\n\
application/dssc+xml				xdssc\r\n\
# application/dvcs\r\n\
application/ecmascript				ecma\r\n\
# application/edi-consent\r\n\
# application/edi-x12\r\n\
# application/edifact\r\n\
application/emma+xml				emma\r\n\
# application/epp+xml\r\n\
application/epub+zip				epub\r\n\
# application/eshop\r\n\
# application/example\r\n\
application/exi					exi\r\n\
# application/fastinfoset\r\n\
# application/fastsoap\r\n\
# application/fits\r\n\
application/font-tdpfr				pfr\r\n\
# application/framework-attributes+xml\r\n\
# application/h224\r\n\
# application/held+xml\r\n\
# application/http\r\n\
application/hyperstudio				stk\r\n\
# application/ibe-key-request+xml\r\n\
# application/ibe-pkg-reply+xml\r\n\
# application/ibe-pp-data\r\n\
# application/iges\r\n\
# application/im-iscomposing+xml\r\n\
# application/index\r\n\
# application/index.cmd\r\n\
# application/index.obj\r\n\
# application/index.response\r\n\
# application/index.vnd\r\n\
application/inkml+xml				ink inkml\r\n\
# application/iotp\r\n\
application/ipfix				ipfix\r\n\
# application/ipp\r\n\
# application/isup\r\n\
application/java-archive			jar\r\n\
application/java-serialized-object		ser\r\n\
application/java-vm				class\r\n\
application/javascript				js\r\n\
application/json				json\r\n\
# application/kpml-request+xml\r\n\
# application/kpml-response+xml\r\n\
application/lost+xml				lostxml\r\n\
application/mac-binhex40			hqx\r\n\
application/mac-compactpro			cpt\r\n\
# application/macwriteii\r\n\
application/mads+xml				mads\r\n\
application/marc				mrc\r\n\
application/marcxml+xml				mrcx\r\n\
application/mathematica				ma nb mb\r\n\
# application/mathml-content+xml\r\n\
# application/mathml-presentation+xml\r\n\
application/mathml+xml				mathml\r\n\
# application/mbms-associated-procedure-description+xml\r\n\
# application/mbms-deregister+xml\r\n\
# application/mbms-envelope+xml\r\n\
# application/mbms-msk+xml\r\n\
# application/mbms-msk-response+xml\r\n\
# application/mbms-protection-description+xml\r\n\
# application/mbms-reception-report+xml\r\n\
# application/mbms-register+xml\r\n\
# application/mbms-register-response+xml\r\n\
# application/mbms-user-service-description+xml\r\n\
application/mbox				mbox\r\n\
# application/media_control+xml\r\n\
application/mediaservercontrol+xml		mscml\r\n\
application/metalink4+xml			meta4\r\n\
application/mets+xml				mets\r\n\
# application/mikey\r\n\
application/mods+xml				mods\r\n\
# application/moss-keys\r\n\
# application/moss-signature\r\n\
# application/mosskey-data\r\n\
# application/mosskey-request\r\n\
application/mp21				m21 mp21\r\n\
application/mp4					mp4s\r\n\
# application/mpeg4-generic\r\n\
# application/mpeg4-iod\r\n\
# application/mpeg4-iod-xmt\r\n\
# application/msc-ivr+xml\r\n\
# application/msc-mixer+xml\r\n\
application/msword				doc dot\r\n\
application/mxf					mxf\r\n\
# application/nasdata\r\n\
# application/news-checkgroups\r\n\
# application/news-groupinfo\r\n\
# application/news-transmission\r\n\
# application/nss\r\n\
# application/ocsp-request\r\n\
# application/ocsp-response\r\n\
application/octet-stream	bin dms lha lrf lzh so iso dmg dist distz pkg bpk dump elc deploy\r\n\
application/oda					oda\r\n\
application/oebps-package+xml			opf\r\n\
application/ogg					ogx\r\n\
application/onenote				onetoc onetoc2 onetmp onepkg\r\n\
application/oxps				oxps\r\n\
# application/parityfec\r\n\
application/patch-ops-error+xml			xer\r\n\
application/pdf					pdf\r\n\
application/pgp-encrypted			pgp\r\n\
# application/pgp-keys\r\n\
application/pgp-signature			asc sig\r\n\
application/pics-rules				prf\r\n\
# application/pidf+xml\r\n\
# application/pidf-diff+xml\r\n\
application/pkcs10				p10\r\n\
application/pkcs7-mime				p7m p7c\r\n\
application/pkcs7-signature			p7s\r\n\
application/pkcs8				p8\r\n\
application/pkix-attr-cert			ac\r\n\
application/pkix-cert				cer\r\n\
application/pkix-crl				crl\r\n\
application/pkix-pkipath			pkipath\r\n\
application/pkixcmp				pki\r\n\
application/pls+xml				pls\r\n\
# application/poc-settings+xml\r\n\
application/postscript				ai eps ps\r\n\
# application/prs.alvestrand.titrax-sheet\r\n\
application/prs.cww				cww\r\n\
# application/prs.nprend\r\n\
# application/prs.plucker\r\n\
# application/prs.rdf-xml-crypt\r\n\
# application/prs.xsf+xml\r\n\
application/pskc+xml				pskcxml\r\n\
# application/qsig\r\n\
application/rdf+xml				rdf\r\n\
application/reginfo+xml				rif\r\n\
application/relax-ng-compact-syntax		rnc\r\n\
# application/remote-printing\r\n\
application/resource-lists+xml			rl\r\n\
application/resource-lists-diff+xml		rld\r\n\
# application/riscos\r\n\
# application/rlmi+xml\r\n\
application/rls-services+xml			rs\r\n\
application/rpki-ghostbusters			gbr\r\n\
application/rpki-manifest			mft\r\n\
application/rpki-roa				roa\r\n\
# application/rpki-updown\r\n\
application/rsd+xml				rsd\r\n\
application/rss+xml				rss\r\n\
application/rtf					rtf\r\n\
# application/rtx\r\n\
# application/samlassertion+xml\r\n\
# application/samlmetadata+xml\r\n\
application/sbml+xml				sbml\r\n\
application/scvp-cv-request			scq\r\n\
application/scvp-cv-response			scs\r\n\
application/scvp-vp-request			spq\r\n\
application/scvp-vp-response			spp\r\n\
application/sdp					sdp\r\n\
# application/set-payment\r\n\
application/set-payment-initiation		setpay\r\n\
# application/set-registration\r\n\
application/set-registration-initiation		setreg\r\n\
# application/sgml\r\n\
# application/sgml-open-catalog\r\n\
application/shf+xml				shf\r\n\
# application/sieve\r\n\
# application/simple-filter+xml\r\n\
# application/simple-message-summary\r\n\
# application/simplesymbolcontainer\r\n\
# application/slate\r\n\
# application/smil\r\n\
application/smil+xml				smi smil\r\n\
# application/soap+fastinfoset\r\n\
# application/soap+xml\r\n\
application/sparql-query			rq\r\n\
application/sparql-results+xml			srx\r\n\
# application/spirits-event+xml\r\n\
application/srgs				gram\r\n\
application/srgs+xml				grxml\r\n\
application/sru+xml				sru\r\n\
application/ssml+xml				ssml\r\n\
# application/tamp-apex-update\r\n\
# application/tamp-apex-update-confirm\r\n\
# application/tamp-community-update\r\n\
# application/tamp-community-update-confirm\r\n\
# application/tamp-error\r\n\
# application/tamp-sequence-adjust\r\n\
# application/tamp-sequence-adjust-confirm\r\n\
# application/tamp-status-query\r\n\
# application/tamp-status-response\r\n\
# application/tamp-update\r\n\
# application/tamp-update-confirm\r\n\
application/tei+xml				tei teicorpus\r\n\
application/thraud+xml				tfi\r\n\
# application/timestamp-query\r\n\
# application/timestamp-reply\r\n\
application/timestamped-data			tsd\r\n\
# application/tve-trigger\r\n\
# application/ulpfec\r\n\
# application/vcard+xml\r\n\
# application/vemmi\r\n\
# application/vividence.scriptfile\r\n\
# application/vnd.3gpp.bsf+xml\r\n\
application/vnd.3gpp.pic-bw-large		plb\r\n\
application/vnd.3gpp.pic-bw-small		psb\r\n\
application/vnd.3gpp.pic-bw-var			pvb\r\n\
# application/vnd.3gpp.sms\r\n\
# application/vnd.3gpp2.bcmcsinfo+xml\r\n\
# application/vnd.3gpp2.sms\r\n\
application/vnd.3gpp2.tcap			tcap\r\n\
application/vnd.3m.post-it-notes		pwn\r\n\
application/vnd.accpac.simply.aso		aso\r\n\
application/vnd.accpac.simply.imp		imp\r\n\
application/vnd.acucobol			acu\r\n\
application/vnd.acucorp				atc acutc\r\n\
application/vnd.adobe.air-application-installer-package+zip	air\r\n\
application/vnd.adobe.fxp			fxp fxpl\r\n\
# application/vnd.adobe.partial-upload\r\n\
application/vnd.adobe.xdp+xml			xdp\r\n\
application/vnd.adobe.xfdf			xfdf\r\n\
# application/vnd.aether.imp\r\n\
# application/vnd.ah-barcode\r\n\
application/vnd.ahead.space			ahead\r\n\
application/vnd.airzip.filesecure.azf		azf\r\n\
application/vnd.airzip.filesecure.azs		azs\r\n\
application/vnd.amazon.ebook			azw\r\n\
application/vnd.americandynamics.acc		acc\r\n\
application/vnd.amiga.ami			ami\r\n\
# application/vnd.amundsen.maze+xml\r\n\
application/vnd.android.package-archive		apk\r\n\
application/vnd.anser-web-certificate-issue-initiation	cii\r\n\
application/vnd.anser-web-funds-transfer-initiation	fti\r\n\
application/vnd.antix.game-component		atx\r\n\
application/vnd.apple.installer+xml		mpkg\r\n\
application/vnd.apple.mpegurl			m3u8\r\n\
# application/vnd.arastra.swi\r\n\
application/vnd.aristanetworks.swi		swi\r\n\
application/vnd.astraea-software.iota		iota\r\n\
application/vnd.audiograph			aep\r\n\
# application/vnd.autopackage\r\n\
# application/vnd.avistar+xml\r\n\
application/vnd.blueice.multipass		mpm\r\n\
# application/vnd.bluetooth.ep.oob\r\n\
application/vnd.bmi				bmi\r\n\
application/vnd.businessobjects			rep\r\n\
# application/vnd.cab-jscript\r\n\
# application/vnd.canon-cpdl\r\n\
# application/vnd.canon-lips\r\n\
# application/vnd.cendio.thinlinc.clientconf\r\n\
application/vnd.chemdraw+xml			cdxml\r\n\
application/vnd.chipnuts.karaoke-mmd		mmd\r\n\
application/vnd.cinderella			cdy\r\n\
# application/vnd.cirpack.isdn-ext\r\n\
application/vnd.claymore			cla\r\n\
application/vnd.cloanto.rp9			rp9\r\n\
application/vnd.clonk.c4group			c4g c4d c4f c4p c4u\r\n\
application/vnd.cluetrust.cartomobile-config		c11amc\r\n\
application/vnd.cluetrust.cartomobile-config-pkg	c11amz\r\n\
# application/vnd.collection+json\r\n\
# application/vnd.commerce-battelle\r\n\
application/vnd.commonspace			csp\r\n\
application/vnd.contact.cmsg			cdbcmsg\r\n\
application/vnd.cosmocaller			cmc\r\n\
application/vnd.crick.clicker			clkx\r\n\
application/vnd.crick.clicker.keyboard		clkk\r\n\
application/vnd.crick.clicker.palette		clkp\r\n\
application/vnd.crick.clicker.template		clkt\r\n\
application/vnd.crick.clicker.wordbank		clkw\r\n\
application/vnd.criticaltools.wbs+xml		wbs\r\n\
application/vnd.ctc-posml			pml\r\n\
# application/vnd.ctct.ws+xml\r\n\
# application/vnd.cups-pdf\r\n\
# application/vnd.cups-postscript\r\n\
application/vnd.cups-ppd			ppd\r\n\
# application/vnd.cups-raster\r\n\
# application/vnd.cups-raw\r\n\
# application/vnd.curl\r\n\
application/vnd.curl.car			car\r\n\
application/vnd.curl.pcurl			pcurl\r\n\
# application/vnd.cybank\r\n\
application/vnd.data-vision.rdz			rdz\r\n\
application/vnd.dece.data			uvf uvvf uvd uvvd\r\n\
application/vnd.dece.ttml+xml			uvt uvvt\r\n\
application/vnd.dece.unspecified		uvx uvvx\r\n\
application/vnd.dece.zip			uvz uvvz\r\n\
application/vnd.denovo.fcselayout-link		fe_launch\r\n\
# application/vnd.dir-bi.plate-dl-nosuffix\r\n\
application/vnd.dna				dna\r\n\
application/vnd.dolby.mlp			mlp\r\n\
# application/vnd.dolby.mobile.1\r\n\
# application/vnd.dolby.mobile.2\r\n\
application/vnd.dpgraph				dpg\r\n\
application/vnd.dreamfactory			dfac\r\n\
application/vnd.dvb.ait				ait\r\n\
# application/vnd.dvb.dvbj\r\n\
# application/vnd.dvb.esgcontainer\r\n\
# application/vnd.dvb.ipdcdftnotifaccess\r\n\
# application/vnd.dvb.ipdcesgaccess\r\n\
# application/vnd.dvb.ipdcesgaccess2\r\n\
# application/vnd.dvb.ipdcesgpdd\r\n\
# application/vnd.dvb.ipdcroaming\r\n\
# application/vnd.dvb.iptv.alfec-base\r\n\
# application/vnd.dvb.iptv.alfec-enhancement\r\n\
# application/vnd.dvb.notif-aggregate-root+xml\r\n\
# application/vnd.dvb.notif-container+xml\r\n\
# application/vnd.dvb.notif-generic+xml\r\n\
# application/vnd.dvb.notif-ia-msglist+xml\r\n\
# application/vnd.dvb.notif-ia-registration-request+xml\r\n\
# application/vnd.dvb.notif-ia-registration-response+xml\r\n\
# application/vnd.dvb.notif-init+xml\r\n\
# application/vnd.dvb.pfr\r\n\
application/vnd.dvb.service			svc\r\n\
# application/vnd.dxr\r\n\
application/vnd.dynageo				geo\r\n\
# application/vnd.easykaraoke.cdgdownload\r\n\
# application/vnd.ecdis-update\r\n\
application/vnd.ecowin.chart			mag\r\n\
# application/vnd.ecowin.filerequest\r\n\
# application/vnd.ecowin.fileupdate\r\n\
# application/vnd.ecowin.series\r\n\
# application/vnd.ecowin.seriesrequest\r\n\
# application/vnd.ecowin.seriesupdate\r\n\
# application/vnd.emclient.accessrequest+xml\r\n\
application/vnd.enliven				nml\r\n\
# application/vnd.eprints.data+xml\r\n\
application/vnd.epson.esf			esf\r\n\
application/vnd.epson.msf			msf\r\n\
application/vnd.epson.quickanime		qam\r\n\
application/vnd.epson.salt			slt\r\n\
application/vnd.epson.ssf			ssf\r\n\
# application/vnd.ericsson.quickcall\r\n\
application/vnd.eszigno3+xml			es3 et3\r\n\
# application/vnd.etsi.aoc+xml\r\n\
# application/vnd.etsi.cug+xml\r\n\
# application/vnd.etsi.iptvcommand+xml\r\n\
# application/vnd.etsi.iptvdiscovery+xml\r\n\
# application/vnd.etsi.iptvprofile+xml\r\n\
# application/vnd.etsi.iptvsad-bc+xml\r\n\
# application/vnd.etsi.iptvsad-cod+xml\r\n\
# application/vnd.etsi.iptvsad-npvr+xml\r\n\
# application/vnd.etsi.iptvservice+xml\r\n\
# application/vnd.etsi.iptvsync+xml\r\n\
# application/vnd.etsi.iptvueprofile+xml\r\n\
# application/vnd.etsi.mcid+xml\r\n\
# application/vnd.etsi.overload-control-policy-dataset+xml\r\n\
# application/vnd.etsi.sci+xml\r\n\
# application/vnd.etsi.simservs+xml\r\n\
# application/vnd.etsi.tsl+xml\r\n\
# application/vnd.etsi.tsl.der\r\n\
# application/vnd.eudora.data\r\n\
application/vnd.ezpix-album			ez2\r\n\
application/vnd.ezpix-package			ez3\r\n\
# application/vnd.f-secure.mobile\r\n\
application/vnd.fdf				fdf\r\n\
application/vnd.fdsn.mseed			mseed\r\n\
application/vnd.fdsn.seed			seed dataless\r\n\
# application/vnd.ffsns\r\n\
# application/vnd.fints\r\n\
application/vnd.flographit			gph\r\n\
application/vnd.fluxtime.clip			ftc\r\n\
# application/vnd.font-fontforge-sfd\r\n\
application/vnd.framemaker			fm frame maker book\r\n\
application/vnd.frogans.fnc			fnc\r\n\
application/vnd.frogans.ltf			ltf\r\n\
application/vnd.fsc.weblaunch			fsc\r\n\
application/vnd.fujitsu.oasys			oas\r\n\
application/vnd.fujitsu.oasys2			oa2\r\n\
application/vnd.fujitsu.oasys3			oa3\r\n\
application/vnd.fujitsu.oasysgp			fg5\r\n\
application/vnd.fujitsu.oasysprs		bh2\r\n\
# application/vnd.fujixerox.art-ex\r\n\
# application/vnd.fujixerox.art4\r\n\
# application/vnd.fujixerox.hbpl\r\n\
application/vnd.fujixerox.ddd			ddd\r\n\
application/vnd.fujixerox.docuworks		xdw\r\n\
application/vnd.fujixerox.docuworks.binder	xbd\r\n\
# application/vnd.fut-misnet\r\n\
application/vnd.fuzzysheet			fzs\r\n\
application/vnd.genomatix.tuxedo		txd\r\n\
# application/vnd.geocube+xml\r\n\
application/vnd.geogebra.file			ggb\r\n\
application/vnd.geogebra.tool			ggt\r\n\
application/vnd.geometry-explorer		gex gre\r\n\
application/vnd.geonext				gxt\r\n\
application/vnd.geoplan				g2w\r\n\
application/vnd.geospace			g3w\r\n\
# application/vnd.globalplatform.card-content-mgt\r\n\
# application/vnd.globalplatform.card-content-mgt-response\r\n\
application/vnd.gmx				gmx\r\n\
application/vnd.google-earth.kml+xml		kml\r\n\
application/vnd.google-earth.kmz		kmz\r\n\
application/vnd.grafeq				gqf gqs\r\n\
# application/vnd.gridmp\r\n\
application/vnd.groove-account			gac\r\n\
application/vnd.groove-help			ghf\r\n\
application/vnd.groove-identity-message		gim\r\n\
application/vnd.groove-injector			grv\r\n\
application/vnd.groove-tool-message		gtm\r\n\
application/vnd.groove-tool-template		tpl\r\n\
application/vnd.groove-vcard			vcg\r\n\
# application/vnd.hal+json\r\n\
application/vnd.hal+xml				hal\r\n\
application/vnd.handheld-entertainment+xml	zmm\r\n\
application/vnd.hbci				hbci\r\n\
# application/vnd.hcl-bireports\r\n\
application/vnd.hhe.lesson-player		les\r\n\
application/vnd.hp-hpgl				hpgl\r\n\
application/vnd.hp-hpid				hpid\r\n\
application/vnd.hp-hps				hps\r\n\
application/vnd.hp-jlyt				jlt\r\n\
application/vnd.hp-pcl				pcl\r\n\
application/vnd.hp-pclxl			pclxl\r\n\
# application/vnd.httphone\r\n\
application/vnd.hydrostatix.sof-data		sfd-hdstx\r\n\
application/vnd.hzn-3d-crossword		x3d\r\n\
# application/vnd.ibm.afplinedata\r\n\
# application/vnd.ibm.electronic-media\r\n\
application/vnd.ibm.minipay			mpy\r\n\
application/vnd.ibm.modcap			afp listafp list3820\r\n\
application/vnd.ibm.rights-management		irm\r\n\
application/vnd.ibm.secure-container		sc\r\n\
application/vnd.iccprofile			icc icm\r\n\
application/vnd.igloader			igl\r\n\
application/vnd.immervision-ivp			ivp\r\n\
application/vnd.immervision-ivu			ivu\r\n\
# application/vnd.informedcontrol.rms+xml\r\n\
# application/vnd.informix-visionary\r\n\
# application/vnd.infotech.project\r\n\
# application/vnd.infotech.project+xml\r\n\
application/vnd.insors.igm			igm\r\n\
application/vnd.intercon.formnet		xpw xpx\r\n\
application/vnd.intergeo			i2g\r\n\
# application/vnd.intertrust.digibox\r\n\
# application/vnd.intertrust.nncp\r\n\
application/vnd.intu.qbo			qbo\r\n\
application/vnd.intu.qfx			qfx\r\n\
# application/vnd.iptc.g2.conceptitem+xml\r\n\
# application/vnd.iptc.g2.knowledgeitem+xml\r\n\
# application/vnd.iptc.g2.newsitem+xml\r\n\
# application/vnd.iptc.g2.packageitem+xml\r\n\
application/vnd.ipunplugged.rcprofile		rcprofile\r\n\
application/vnd.irepository.package+xml		irp\r\n\
application/vnd.is-xpr				xpr\r\n\
application/vnd.isac.fcs			fcs\r\n\
application/vnd.jam				jam\r\n\
# application/vnd.japannet-directory-service\r\n\
# application/vnd.japannet-jpnstore-wakeup\r\n\
# application/vnd.japannet-payment-wakeup\r\n\
# application/vnd.japannet-registration\r\n\
# application/vnd.japannet-registration-wakeup\r\n\
# application/vnd.japannet-setstore-wakeup\r\n\
# application/vnd.japannet-verification\r\n\
# application/vnd.japannet-verification-wakeup\r\n\
application/vnd.jcp.javame.midlet-rms		rms\r\n\
application/vnd.jisp				jisp\r\n\
application/vnd.joost.joda-archive		joda\r\n\
application/vnd.kahootz				ktz ktr\r\n\
application/vnd.kde.karbon			karbon\r\n\
application/vnd.kde.kchart			chrt\r\n\
application/vnd.kde.kformula			kfo\r\n\
application/vnd.kde.kivio			flw\r\n\
application/vnd.kde.kontour			kon\r\n\
application/vnd.kde.kpresenter			kpr kpt\r\n\
application/vnd.kde.kspread			ksp\r\n\
application/vnd.kde.kword			kwd kwt\r\n\
application/vnd.kenameaapp			htke\r\n\
application/vnd.kidspiration			kia\r\n\
application/vnd.kinar				kne knp\r\n\
application/vnd.koan				skp skd skt skm\r\n\
application/vnd.kodak-descriptor		sse\r\n\
application/vnd.las.las+xml			lasxml\r\n\
# application/vnd.liberty-request+xml\r\n\
application/vnd.llamagraphics.life-balance.desktop	lbd\r\n\
application/vnd.llamagraphics.life-balance.exchange+xml	lbe\r\n\
application/vnd.lotus-1-2-3			123\r\n\
application/vnd.lotus-approach			apr\r\n\
application/vnd.lotus-freelance			pre\r\n\
application/vnd.lotus-notes			nsf\r\n\
application/vnd.lotus-organizer			org\r\n\
application/vnd.lotus-screencam			scm\r\n\
application/vnd.lotus-wordpro			lwp\r\n\
application/vnd.macports.portpkg		portpkg\r\n\
# application/vnd.marlin.drm.actiontoken+xml\r\n\
# application/vnd.marlin.drm.conftoken+xml\r\n\
# application/vnd.marlin.drm.license+xml\r\n\
# application/vnd.marlin.drm.mdcf\r\n\
application/vnd.mcd				mcd\r\n\
application/vnd.medcalcdata			mc1\r\n\
application/vnd.mediastation.cdkey		cdkey\r\n\
# application/vnd.meridian-slingshot\r\n\
application/vnd.mfer				mwf\r\n\
application/vnd.mfmp				mfm\r\n\
application/vnd.micrografx.flo			flo\r\n\
application/vnd.micrografx.igx			igx\r\n\
application/vnd.mif				mif\r\n\
# application/vnd.minisoft-hp3000-save\r\n\
# application/vnd.mitsubishi.misty-guard.trustweb\r\n\
application/vnd.mobius.daf			daf\r\n\
application/vnd.mobius.dis			dis\r\n\
application/vnd.mobius.mbk			mbk\r\n\
application/vnd.mobius.mqy			mqy\r\n\
application/vnd.mobius.msl			msl\r\n\
application/vnd.mobius.plc			plc\r\n\
application/vnd.mobius.txf			txf\r\n\
application/vnd.mophun.application		mpn\r\n\
application/vnd.mophun.certificate		mpc\r\n\
# application/vnd.motorola.flexsuite\r\n\
# application/vnd.motorola.flexsuite.adsi\r\n\
# application/vnd.motorola.flexsuite.fis\r\n\
# application/vnd.motorola.flexsuite.gotap\r\n\
# application/vnd.motorola.flexsuite.kmr\r\n\
# application/vnd.motorola.flexsuite.ttc\r\n\
# application/vnd.motorola.flexsuite.wem\r\n\
# application/vnd.motorola.iprm\r\n\
application/vnd.mozilla.xul+xml			xul\r\n\
application/vnd.ms-artgalry			cil\r\n\
# application/vnd.ms-asf\r\n\
application/vnd.ms-cab-compressed		cab\r\n\
application/vnd.ms-excel			xls xlm xla xlc xlt xlw\r\n\
application/vnd.ms-excel.addin.macroenabled.12		xlam\r\n\
application/vnd.ms-excel.sheet.binary.macroenabled.12	xlsb\r\n\
application/vnd.ms-excel.sheet.macroenabled.12		xlsm\r\n\
application/vnd.ms-excel.template.macroenabled.12	xltm\r\n\
application/vnd.ms-fontobject			eot\r\n\
application/vnd.ms-htmlhelp			chm\r\n\
application/vnd.ms-ims				ims\r\n\
application/vnd.ms-lrm				lrm\r\n\
# application/vnd.ms-office.activex+xml\r\n\
application/vnd.ms-officetheme			thmx\r\n\
application/vnd.ms-pki.seccat			cat\r\n\
application/vnd.ms-pki.stl			stl\r\n\
# application/vnd.ms-playready.initiator+xml\r\n\
application/vnd.ms-powerpoint			ppt pps pot\r\n\
application/vnd.ms-powerpoint.addin.macroenabled.12		ppam\r\n\
application/vnd.ms-powerpoint.presentation.macroenabled.12	pptm\r\n\
application/vnd.ms-powerpoint.slide.macroenabled.12		sldm\r\n\
application/vnd.ms-powerpoint.slideshow.macroenabled.12		ppsm\r\n\
application/vnd.ms-powerpoint.template.macroenabled.12		potm\r\n\
application/vnd.ms-project			mpp mpt\r\n\
# application/vnd.ms-tnef\r\n\
# application/vnd.ms-wmdrm.lic-chlg-req\r\n\
# application/vnd.ms-wmdrm.lic-resp\r\n\
# application/vnd.ms-wmdrm.meter-chlg-req\r\n\
# application/vnd.ms-wmdrm.meter-resp\r\n\
application/vnd.ms-word.document.macroenabled.12	docm\r\n\
application/vnd.ms-word.template.macroenabled.12	dotm\r\n\
application/vnd.ms-works			wps wks wcm wdb\r\n\
application/vnd.ms-wpl				wpl\r\n\
application/vnd.ms-xpsdocument			xps\r\n\
application/vnd.mseq				mseq\r\n\
# application/vnd.msign\r\n\
# application/vnd.multiad.creator\r\n\
# application/vnd.multiad.creator.cif\r\n\
# application/vnd.music-niff\r\n\
application/vnd.musician			mus\r\n\
application/vnd.muvee.style			msty\r\n\
application/vnd.mynfc				taglet\r\n\
# application/vnd.ncd.control\r\n\
# application/vnd.ncd.reference\r\n\
# application/vnd.nervana\r\n\
# application/vnd.netfpx\r\n\
application/vnd.neurolanguage.nlu		nlu\r\n\
application/vnd.noblenet-directory		nnd\r\n\
application/vnd.noblenet-sealer			nns\r\n\
application/vnd.noblenet-web			nnw\r\n\
# application/vnd.nokia.catalogs\r\n\
# application/vnd.nokia.conml+wbxml\r\n\
# application/vnd.nokia.conml+xml\r\n\
# application/vnd.nokia.isds-radio-presets\r\n\
# application/vnd.nokia.iptv.config+xml\r\n\
# application/vnd.nokia.landmark+wbxml\r\n\
# application/vnd.nokia.landmark+xml\r\n\
# application/vnd.nokia.landmarkcollection+xml\r\n\
# application/vnd.nokia.n-gage.ac+xml\r\n\
application/vnd.nokia.n-gage.data		ngdat\r\n\
application/vnd.nokia.n-gage.symbian.install	n-gage\r\n\
# application/vnd.nokia.ncd\r\n\
# application/vnd.nokia.pcd+wbxml\r\n\
# application/vnd.nokia.pcd+xml\r\n\
application/vnd.nokia.radio-preset		rpst\r\n\
application/vnd.nokia.radio-presets		rpss\r\n\
application/vnd.novadigm.edm			edm\r\n\
application/vnd.novadigm.edx			edx\r\n\
application/vnd.novadigm.ext			ext\r\n\
# application/vnd.ntt-local.file-transfer\r\n\
# application/vnd.ntt-local.sip-ta_remote\r\n\
# application/vnd.ntt-local.sip-ta_tcp_stream\r\n\
application/vnd.oasis.opendocument.chart		odc\r\n\
application/vnd.oasis.opendocument.chart-template	otc\r\n\
application/vnd.oasis.opendocument.database		odb\r\n\
application/vnd.oasis.opendocument.formula		odf\r\n\
application/vnd.oasis.opendocument.formula-template	odft\r\n\
application/vnd.oasis.opendocument.graphics		odg\r\n\
application/vnd.oasis.opendocument.graphics-template	otg\r\n\
application/vnd.oasis.opendocument.image		odi\r\n\
application/vnd.oasis.opendocument.image-template	oti\r\n\
application/vnd.oasis.opendocument.presentation		odp\r\n\
application/vnd.oasis.opendocument.presentation-template	otp\r\n\
application/vnd.oasis.opendocument.spreadsheet		ods\r\n\
application/vnd.oasis.opendocument.spreadsheet-template	ots\r\n\
application/vnd.oasis.opendocument.text			odt\r\n\
application/vnd.oasis.opendocument.text-master		odm\r\n\
application/vnd.oasis.opendocument.text-template	ott\r\n\
application/vnd.oasis.opendocument.text-web		oth\r\n\
# application/vnd.obn\r\n\
# application/vnd.oftn.l10n+json\r\n\
# application/vnd.oipf.contentaccessdownload+xml\r\n\
# application/vnd.oipf.contentaccessstreaming+xml\r\n\
# application/vnd.oipf.cspg-hexbinary\r\n\
# application/vnd.oipf.dae.svg+xml\r\n\
# application/vnd.oipf.dae.xhtml+xml\r\n\
# application/vnd.oipf.mippvcontrolmessage+xml\r\n\
# application/vnd.oipf.pae.gem\r\n\
# application/vnd.oipf.spdiscovery+xml\r\n\
# application/vnd.oipf.spdlist+xml\r\n\
# application/vnd.oipf.ueprofile+xml\r\n\
# application/vnd.oipf.userprofile+xml\r\n\
application/vnd.olpc-sugar			xo\r\n\
# application/vnd.oma-scws-config\r\n\
# application/vnd.oma-scws-http-request\r\n\
# application/vnd.oma-scws-http-response\r\n\
# application/vnd.oma.bcast.associated-procedure-parameter+xml\r\n\
# application/vnd.oma.bcast.drm-trigger+xml\r\n\
# application/vnd.oma.bcast.imd+xml\r\n\
# application/vnd.oma.bcast.ltkm\r\n\
# application/vnd.oma.bcast.notification+xml\r\n\
# application/vnd.oma.bcast.provisioningtrigger\r\n\
# application/vnd.oma.bcast.sgboot\r\n\
# application/vnd.oma.bcast.sgdd+xml\r\n\
# application/vnd.oma.bcast.sgdu\r\n\
# application/vnd.oma.bcast.simple-symbol-container\r\n\
# application/vnd.oma.bcast.smartcard-trigger+xml\r\n\
# application/vnd.oma.bcast.sprov+xml\r\n\
# application/vnd.oma.bcast.stkm\r\n\
# application/vnd.oma.cab-address-book+xml\r\n\
# application/vnd.oma.cab-feature-handler+xml\r\n\
# application/vnd.oma.cab-pcc+xml\r\n\
# application/vnd.oma.cab-user-prefs+xml\r\n\
# application/vnd.oma.dcd\r\n\
# application/vnd.oma.dcdc\r\n\
application/vnd.oma.dd2+xml			dd2\r\n\
# application/vnd.oma.drm.risd+xml\r\n\
# application/vnd.oma.group-usage-list+xml\r\n\
# application/vnd.oma.pal+xml\r\n\
# application/vnd.oma.poc.detailed-progress-report+xml\r\n\
# application/vnd.oma.poc.final-report+xml\r\n\
# application/vnd.oma.poc.groups+xml\r\n\
# application/vnd.oma.poc.invocation-descriptor+xml\r\n\
# application/vnd.oma.poc.optimized-progress-report+xml\r\n\
# application/vnd.oma.push\r\n\
# application/vnd.oma.scidm.messages+xml\r\n\
# application/vnd.oma.xcap-directory+xml\r\n\
# application/vnd.omads-email+xml\r\n\
# application/vnd.omads-file+xml\r\n\
# application/vnd.omads-folder+xml\r\n\
# application/vnd.omaloc-supl-init\r\n\
application/vnd.openofficeorg.extension		oxt\r\n\
# application/vnd.openxmlformats-officedocument.custom-properties+xml\r\n\
# application/vnd.openxmlformats-officedocument.customxmlproperties+xml\r\n\
# application/vnd.openxmlformats-officedocument.drawing+xml\r\n\
# application/vnd.openxmlformats-officedocument.drawingml.chart+xml\r\n\
# application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml\r\n\
# application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml\r\n\
# application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml\r\n\
# application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml\r\n\
# application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml\r\n\
# application/vnd.openxmlformats-officedocument.extended-properties+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.comments+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml\r\n\
application/vnd.openxmlformats-officedocument.presentationml.presentation	pptx\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.presprops+xml\r\n\
application/vnd.openxmlformats-officedocument.presentationml.slide	sldx\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.slide+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml\r\n\
application/vnd.openxmlformats-officedocument.presentationml.slideshow	ppsx\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.tags+xml\r\n\
application/vnd.openxmlformats-officedocument.presentationml.template	potx\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.template.main+xml\r\n\
# application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml\r\n\
application/vnd.openxmlformats-officedocument.spreadsheetml.sheet	xlsx\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml\r\n\
application/vnd.openxmlformats-officedocument.spreadsheetml.template	xltx\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml\r\n\
# application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\r\n\
# application/vnd.openxmlformats-officedocument.theme+xml\r\n\
# application/vnd.openxmlformats-officedocument.themeoverride+xml\r\n\
# application/vnd.openxmlformats-officedocument.vmldrawing\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml\r\n\
application/vnd.openxmlformats-officedocument.wordprocessingml.document	docx\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml\r\n\
application/vnd.openxmlformats-officedocument.wordprocessingml.template	dotx\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml\r\n\
# application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml\r\n\
# application/vnd.openxmlformats-package.core-properties+xml\r\n\
# application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml\r\n\
# application/vnd.openxmlformats-package.relationships+xml\r\n\
# application/vnd.quobject-quoxdocument\r\n\
# application/vnd.osa.netdeploy\r\n\
application/vnd.osgeo.mapguide.package		mgp\r\n\
# application/vnd.osgi.bundle\r\n\
application/vnd.osgi.dp				dp\r\n\
# application/vnd.otps.ct-kip+xml\r\n\
application/vnd.palm				pdb pqa oprc\r\n\
# application/vnd.paos.xml\r\n\
application/vnd.pawaafile			paw\r\n\
application/vnd.pg.format			str\r\n\
application/vnd.pg.osasli			ei6\r\n\
# application/vnd.piaccess.application-licence\r\n\
application/vnd.picsel				efif\r\n\
application/vnd.pmi.widget			wg\r\n\
# application/vnd.poc.group-advertisement+xml\r\n\
application/vnd.pocketlearn			plf\r\n\
application/vnd.powerbuilder6			pbd\r\n\
# application/vnd.powerbuilder6-s\r\n\
# application/vnd.powerbuilder7\r\n\
# application/vnd.powerbuilder7-s\r\n\
# application/vnd.powerbuilder75\r\n\
# application/vnd.powerbuilder75-s\r\n\
# application/vnd.preminet\r\n\
application/vnd.previewsystems.box		box\r\n\
application/vnd.proteus.magazine		mgz\r\n\
application/vnd.publishare-delta-tree		qps\r\n\
application/vnd.pvi.ptid1			ptid\r\n\
# application/vnd.pwg-multiplexed\r\n\
# application/vnd.pwg-xhtml-print+xml\r\n\
# application/vnd.qualcomm.brew-app-res\r\n\
application/vnd.quark.quarkxpress		qxd qxt qwd qwt qxl qxb\r\n\
# application/vnd.radisys.moml+xml\r\n\
# application/vnd.radisys.msml+xml\r\n\
# application/vnd.radisys.msml-audit+xml\r\n\
# application/vnd.radisys.msml-audit-conf+xml\r\n\
# application/vnd.radisys.msml-audit-conn+xml\r\n\
# application/vnd.radisys.msml-audit-dialog+xml\r\n\
# application/vnd.radisys.msml-audit-stream+xml\r\n\
# application/vnd.radisys.msml-conf+xml\r\n\
# application/vnd.radisys.msml-dialog+xml\r\n\
# application/vnd.radisys.msml-dialog-base+xml\r\n\
# application/vnd.radisys.msml-dialog-fax-detect+xml\r\n\
# application/vnd.radisys.msml-dialog-fax-sendrecv+xml\r\n\
# application/vnd.radisys.msml-dialog-group+xml\r\n\
# application/vnd.radisys.msml-dialog-speech+xml\r\n\
# application/vnd.radisys.msml-dialog-transform+xml\r\n\
# application/vnd.rainstor.data\r\n\
# application/vnd.rapid\r\n\
application/vnd.realvnc.bed			bed\r\n\
application/vnd.recordare.musicxml		mxl\r\n\
application/vnd.recordare.musicxml+xml		musicxml\r\n\
# application/vnd.renlearn.rlprint\r\n\
application/vnd.rig.cryptonote			cryptonote\r\n\
application/vnd.rim.cod				cod\r\n\
application/vnd.rn-realmedia			rm\r\n\
application/vnd.route66.link66+xml		link66\r\n\
# application/vnd.ruckus.download\r\n\
# application/vnd.s3sms\r\n\
application/vnd.sailingtracker.track		st\r\n\
# application/vnd.sbm.cid\r\n\
# application/vnd.sbm.mid2\r\n\
# application/vnd.scribus\r\n\
# application/vnd.sealed.3df\r\n\
# application/vnd.sealed.csf\r\n\
# application/vnd.sealed.doc\r\n\
# application/vnd.sealed.eml\r\n\
# application/vnd.sealed.mht\r\n\
# application/vnd.sealed.net\r\n\
# application/vnd.sealed.ppt\r\n\
# application/vnd.sealed.tiff\r\n\
# application/vnd.sealed.xls\r\n\
# application/vnd.sealedmedia.softseal.html\r\n\
# application/vnd.sealedmedia.softseal.pdf\r\n\
application/vnd.seemail				see\r\n\
application/vnd.sema				sema\r\n\
application/vnd.semd				semd\r\n\
application/vnd.semf				semf\r\n\
application/vnd.shana.informed.formdata		ifm\r\n\
application/vnd.shana.informed.formtemplate	itp\r\n\
application/vnd.shana.informed.interchange	iif\r\n\
application/vnd.shana.informed.package		ipk\r\n\
application/vnd.simtech-mindmapper		twd twds\r\n\
application/vnd.smaf				mmf\r\n\
# application/vnd.smart.notebook\r\n\
application/vnd.smart.teacher			teacher\r\n\
# application/vnd.software602.filler.form+xml\r\n\
# application/vnd.software602.filler.form-xml-zip\r\n\
application/vnd.solent.sdkm+xml			sdkm sdkd\r\n\
application/vnd.spotfire.dxp			dxp\r\n\
application/vnd.spotfire.sfs			sfs\r\n\
# application/vnd.sss-cod\r\n\
# application/vnd.sss-dtf\r\n\
# application/vnd.sss-ntf\r\n\
application/vnd.stardivision.calc		sdc\r\n\
application/vnd.stardivision.draw		sda\r\n\
application/vnd.stardivision.impress		sdd\r\n\
application/vnd.stardivision.math		smf\r\n\
application/vnd.stardivision.writer		sdw vor\r\n\
application/vnd.stardivision.writer-global	sgl\r\n\
application/vnd.stepmania.package		smzip\r\n\
application/vnd.stepmania.stepchart		sm\r\n\
# application/vnd.street-stream\r\n\
application/vnd.sun.xml.calc			sxc\r\n\
application/vnd.sun.xml.calc.template		stc\r\n\
application/vnd.sun.xml.draw			sxd\r\n\
application/vnd.sun.xml.draw.template		std\r\n\
application/vnd.sun.xml.impress			sxi\r\n\
application/vnd.sun.xml.impress.template	sti\r\n\
application/vnd.sun.xml.math			sxm\r\n\
application/vnd.sun.xml.writer			sxw\r\n\
application/vnd.sun.xml.writer.global		sxg\r\n\
application/vnd.sun.xml.writer.template		stw\r\n\
# application/vnd.sun.wadl+xml\r\n\
application/vnd.sus-calendar			sus susp\r\n\
application/vnd.svd				svd\r\n\
# application/vnd.swiftview-ics\r\n\
application/vnd.symbian.install			sis sisx\r\n\
application/vnd.syncml+xml			xsm\r\n\
application/vnd.syncml.dm+wbxml			bdm\r\n\
application/vnd.syncml.dm+xml			xdm\r\n\
# application/vnd.syncml.dm.notification\r\n\
# application/vnd.syncml.ds.notification\r\n\
application/vnd.tao.intent-module-archive	tao\r\n\
application/vnd.tcpdump.pcap			pcap cap dmp\r\n\
application/vnd.tmobile-livetv			tmo\r\n\
application/vnd.trid.tpt			tpt\r\n\
application/vnd.triscape.mxs			mxs\r\n\
application/vnd.trueapp				tra\r\n\
# application/vnd.truedoc\r\n\
# application/vnd.ubisoft.webplayer\r\n\
application/vnd.ufdl				ufd ufdl\r\n\
application/vnd.uiq.theme			utz\r\n\
application/vnd.umajin				umj\r\n\
application/vnd.unity				unityweb\r\n\
application/vnd.uoml+xml			uoml\r\n\
# application/vnd.uplanet.alert\r\n\
# application/vnd.uplanet.alert-wbxml\r\n\
# application/vnd.uplanet.bearer-choice\r\n\
# application/vnd.uplanet.bearer-choice-wbxml\r\n\
# application/vnd.uplanet.cacheop\r\n\
# application/vnd.uplanet.cacheop-wbxml\r\n\
# application/vnd.uplanet.channel\r\n\
# application/vnd.uplanet.channel-wbxml\r\n\
# application/vnd.uplanet.list\r\n\
# application/vnd.uplanet.list-wbxml\r\n\
# application/vnd.uplanet.listcmd\r\n\
# application/vnd.uplanet.listcmd-wbxml\r\n\
# application/vnd.uplanet.signal\r\n\
application/vnd.vcx				vcx\r\n\
# application/vnd.vd-study\r\n\
# application/vnd.vectorworks\r\n\
# application/vnd.verimatrix.vcas\r\n\
# application/vnd.vidsoft.vidconference\r\n\
application/vnd.visio				vsd vst vss vsw\r\n\
application/vnd.visionary			vis\r\n\
# application/vnd.vividence.scriptfile\r\n\
application/vnd.vsf				vsf\r\n\
# application/vnd.wap.sic\r\n\
# application/vnd.wap.slc\r\n\
application/vnd.wap.wbxml			wbxml\r\n\
application/vnd.wap.wmlc			wmlc\r\n\
application/vnd.wap.wmlscriptc			wmlsc\r\n\
application/vnd.webturbo			wtb\r\n\
# application/vnd.wfa.wsc\r\n\
# application/vnd.wmc\r\n\
# application/vnd.wmf.bootstrap\r\n\
# application/vnd.wolfram.mathematica\r\n\
# application/vnd.wolfram.mathematica.package\r\n\
application/vnd.wolfram.player			nbp\r\n\
application/vnd.wordperfect			wpd\r\n\
application/vnd.wqd				wqd\r\n\
# application/vnd.wrq-hp3000-labelled\r\n\
application/vnd.wt.stf				stf\r\n\
# application/vnd.wv.csp+wbxml\r\n\
# application/vnd.wv.csp+xml\r\n\
# application/vnd.wv.ssp+xml\r\n\
application/vnd.xara				xar\r\n\
application/vnd.xfdl				xfdl\r\n\
# application/vnd.xfdl.webform\r\n\
# application/vnd.xmi+xml\r\n\
# application/vnd.xmpie.cpkg\r\n\
# application/vnd.xmpie.dpkg\r\n\
# application/vnd.xmpie.plan\r\n\
# application/vnd.xmpie.ppkg\r\n\
# application/vnd.xmpie.xlim\r\n\
application/vnd.yamaha.hv-dic			hvd\r\n\
application/vnd.yamaha.hv-script		hvs\r\n\
application/vnd.yamaha.hv-voice			hvp\r\n\
application/vnd.yamaha.openscoreformat			osf\r\n\
application/vnd.yamaha.openscoreformat.osfpvg+xml	osfpvg\r\n\
# application/vnd.yamaha.remote-setup\r\n\
application/vnd.yamaha.smaf-audio		saf\r\n\
application/vnd.yamaha.smaf-phrase		spf\r\n\
# application/vnd.yamaha.through-ngn\r\n\
# application/vnd.yamaha.tunnel-udpencap\r\n\
application/vnd.yellowriver-custom-menu		cmp\r\n\
application/vnd.zul				zir zirz\r\n\
application/vnd.zzazz.deck+xml			zaz\r\n\
application/voicexml+xml			vxml\r\n\
# application/vq-rtcpxr\r\n\
# application/watcherinfo+xml\r\n\
# application/whoispp-query\r\n\
# application/whoispp-response\r\n\
application/widget				wgt\r\n\
application/winhlp				hlp\r\n\
# application/wita\r\n\
# application/wordperfect5.1\r\n\
application/wsdl+xml				wsdl\r\n\
application/wspolicy+xml			wspolicy\r\n\
application/x-7z-compressed			7z\r\n\
application/x-abiword				abw\r\n\
application/x-ace-compressed			ace\r\n\
application/x-authorware-bin			aab x32 u32 vox\r\n\
application/x-authorware-map			aam\r\n\
application/x-authorware-seg			aas\r\n\
application/x-bcpio				bcpio\r\n\
application/x-bittorrent			torrent\r\n\
application/x-bzip				bz\r\n\
application/x-bzip2				bz2 boz\r\n\
application/x-cdlink				vcd\r\n\
application/x-chat				chat\r\n\
application/x-chess-pgn				pgn\r\n\
# application/x-compress\r\n\
application/x-cpio				cpio\r\n\
application/x-csh				csh\r\n\
application/x-debian-package			deb udeb\r\n\
application/x-director			dir dcr dxr cst cct cxt w3d fgd swa\r\n\
application/x-doom				wad\r\n\
application/x-dtbncx+xml			ncx\r\n\
application/x-dtbook+xml			dtb\r\n\
application/x-dtbresource+xml			res\r\n\
application/x-dvi				dvi\r\n\
application/x-font-bdf				bdf\r\n\
# application/x-font-dos\r\n\
# application/x-font-framemaker\r\n\
application/x-font-ghostscript			gsf\r\n\
# application/x-font-libgrx\r\n\
application/x-font-linux-psf			psf\r\n\
application/x-font-otf				otf\r\n\
application/x-font-pcf				pcf\r\n\
application/x-font-snf				snf\r\n\
# application/x-font-speedo\r\n\
# application/x-font-sunos-news\r\n\
application/x-font-ttf				ttf ttc\r\n\
application/x-font-type1			pfa pfb pfm afm\r\n\
application/x-font-woff				woff\r\n\
# application/x-font-vfont\r\n\
application/x-futuresplash			spl\r\n\
application/x-gnumeric				gnumeric\r\n\
application/x-gtar				gtar\r\n\
# application/x-gzip\r\n\
application/x-hdf				hdf\r\n\
application/x-java-jnlp-file			jnlp\r\n\
application/x-latex				latex\r\n\
application/x-mobipocket-ebook			prc mobi\r\n\
application/x-ms-application			application\r\n\
application/x-ms-wmd				wmd\r\n\
application/x-ms-wmz				wmz\r\n\
application/x-ms-xbap				xbap\r\n\
application/x-msaccess				mdb\r\n\
application/x-msbinder				obd\r\n\
application/x-mscardfile			crd\r\n\
application/x-msclip				clp\r\n\
application/x-msdownload			exe dll com bat msi\r\n\
application/x-msmediaview			mvb m13 m14\r\n\
application/x-msmetafile			wmf\r\n\
application/x-msmoney				mny\r\n\
application/x-mspublisher			pub\r\n\
application/x-msschedule			scd\r\n\
application/x-msterminal			trm\r\n\
application/x-mswrite				wri\r\n\
application/x-netcdf				nc cdf\r\n\
application/x-pkcs12				p12 pfx\r\n\
application/x-pkcs7-certificates		p7b spc\r\n\
application/x-pkcs7-certreqresp			p7r\r\n\
application/x-rar-compressed			rar\r\n\
application/x-sh				sh\r\n\
application/x-shar				shar\r\n\
application/x-shockwave-flash			swf\r\n\
application/x-silverlight-app			xap\r\n\
application/x-stuffit				sit\r\n\
application/x-stuffitx				sitx\r\n\
application/x-sv4cpio				sv4cpio\r\n\
application/x-sv4crc				sv4crc\r\n\
application/x-tar				tar\r\n\
application/x-tcl				tcl\r\n\
application/x-tex				tex\r\n\
application/x-tex-tfm				tfm\r\n\
application/x-texinfo				texinfo texi\r\n\
application/x-ustar				ustar\r\n\
application/x-wais-source			src\r\n\
application/x-x509-ca-cert			der crt\r\n\
application/x-xfig				fig\r\n\
application/x-xpinstall				xpi\r\n\
# application/x400-bp\r\n\
# application/xcap-att+xml\r\n\
# application/xcap-caps+xml\r\n\
application/xcap-diff+xml			xdf\r\n\
# application/xcap-el+xml\r\n\
# application/xcap-error+xml\r\n\
# application/xcap-ns+xml\r\n\
# application/xcon-conference-info-diff+xml\r\n\
# application/xcon-conference-info+xml\r\n\
application/xenc+xml				xenc\r\n\
application/xhtml+xml				xhtml xht\r\n\
# application/xhtml-voice+xml\r\n\
application/xml					xml xsl\r\n\
application/xml-dtd				dtd\r\n\
# application/xml-external-parsed-entity\r\n\
# application/xmpp+xml\r\n\
application/xop+xml				xop\r\n\
application/xslt+xml				xslt\r\n\
application/xspf+xml				xspf\r\n\
application/xv+xml				mxml xhvml xvml xvm\r\n\
application/yang				yang\r\n\
application/yin+xml				yin\r\n\
application/zip					zip\r\n\
# audio/1d-interleaved-parityfec\r\n\
# audio/32kadpcm\r\n\
# audio/3gpp\r\n\
# audio/3gpp2\r\n\
# audio/ac3\r\n\
audio/adpcm					adp\r\n\
# audio/amr\r\n\
# audio/amr-wb\r\n\
# audio/amr-wb+\r\n\
# audio/asc\r\n\
# audio/atrac-advanced-lossless\r\n\
# audio/atrac-x\r\n\
# audio/atrac3\r\n\
audio/basic					au snd\r\n\
# audio/bv16\r\n\
# audio/bv32\r\n\
# audio/clearmode\r\n\
# audio/cn\r\n\
# audio/dat12\r\n\
# audio/dls\r\n\
# audio/dsr-es201108\r\n\
# audio/dsr-es202050\r\n\
# audio/dsr-es202211\r\n\
# audio/dsr-es202212\r\n\
# audio/dv\r\n\
# audio/dvi4\r\n\
# audio/eac3\r\n\
# audio/evrc\r\n\
# audio/evrc-qcp\r\n\
# audio/evrc0\r\n\
# audio/evrc1\r\n\
# audio/evrcb\r\n\
# audio/evrcb0\r\n\
# audio/evrcb1\r\n\
# audio/evrcwb\r\n\
# audio/evrcwb0\r\n\
# audio/evrcwb1\r\n\
# audio/example\r\n\
# audio/fwdred\r\n\
# audio/g719\r\n\
# audio/g722\r\n\
# audio/g7221\r\n\
# audio/g723\r\n\
# audio/g726-16\r\n\
# audio/g726-24\r\n\
# audio/g726-32\r\n\
# audio/g726-40\r\n\
# audio/g728\r\n\
# audio/g729\r\n\
# audio/g7291\r\n\
# audio/g729d\r\n\
# audio/g729e\r\n\
# audio/gsm\r\n\
# audio/gsm-efr\r\n\
# audio/gsm-hr-08\r\n\
# audio/ilbc\r\n\
# audio/ip-mr_v2.5\r\n\
# audio/l16\r\n\
# audio/l20\r\n\
# audio/l24\r\n\
# audio/l8\r\n\
# audio/lpc\r\n\
audio/midi					mid midi kar rmi\r\n\
# audio/mobile-xmf\r\n\
audio/mp4					mp4a\r\n\
# audio/mp4a-latm\r\n\
# audio/mpa\r\n\
# audio/mpa-robust\r\n\
audio/mpeg					mpga mp2 mp2a mp3 m2a m3a\r\n\
# audio/mpeg4-generic\r\n\
audio/ogg					oga ogg spx\r\n\
# audio/parityfec\r\n\
# audio/pcma\r\n\
# audio/pcma-wb\r\n\
# audio/pcmu-wb\r\n\
# audio/pcmu\r\n\
# audio/prs.sid\r\n\
# audio/qcelp\r\n\
# audio/red\r\n\
# audio/rtp-enc-aescm128\r\n\
# audio/rtp-midi\r\n\
# audio/rtx\r\n\
# audio/smv\r\n\
# audio/smv0\r\n\
# audio/smv-qcp\r\n\
# audio/sp-midi\r\n\
# audio/speex\r\n\
# audio/t140c\r\n\
# audio/t38\r\n\
# audio/telephone-event\r\n\
# audio/tone\r\n\
# audio/uemclip\r\n\
# audio/ulpfec\r\n\
# audio/vdvi\r\n\
# audio/vmr-wb\r\n\
# audio/vnd.3gpp.iufp\r\n\
# audio/vnd.4sb\r\n\
# audio/vnd.audiokoz\r\n\
# audio/vnd.celp\r\n\
# audio/vnd.cisco.nse\r\n\
# audio/vnd.cmles.radio-events\r\n\
# audio/vnd.cns.anp1\r\n\
# audio/vnd.cns.inf1\r\n\
audio/vnd.dece.audio				uva uvva\r\n\
audio/vnd.digital-winds				eol\r\n\
# audio/vnd.dlna.adts\r\n\
# audio/vnd.dolby.heaac.1\r\n\
# audio/vnd.dolby.heaac.2\r\n\
# audio/vnd.dolby.mlp\r\n\
# audio/vnd.dolby.mps\r\n\
# audio/vnd.dolby.pl2\r\n\
# audio/vnd.dolby.pl2x\r\n\
# audio/vnd.dolby.pl2z\r\n\
# audio/vnd.dolby.pulse.1\r\n\
audio/vnd.dra					dra\r\n\
audio/vnd.dts					dts\r\n\
audio/vnd.dts.hd				dtshd\r\n\
# audio/vnd.dvb.file				dvb\r\n\
# audio/vnd.everad.plj\r\n\
# audio/vnd.hns.audio\r\n\
audio/vnd.lucent.voice				lvp\r\n\
audio/vnd.ms-playready.media.pya		pya\r\n\
# audio/vnd.nokia.mobile-xmf\r\n\
# audio/vnd.nortel.vbk\r\n\
audio/vnd.nuera.ecelp4800			ecelp4800\r\n\
audio/vnd.nuera.ecelp7470			ecelp7470\r\n\
audio/vnd.nuera.ecelp9600			ecelp9600\r\n\
# audio/vnd.octel.sbc\r\n\
# audio/vnd.qcelp\r\n\
# audio/vnd.rhetorex.32kadpcm\r\n\
audio/vnd.rip					rip\r\n\
# audio/vnd.sealedmedia.softseal.mpeg\r\n\
# audio/vnd.vmx.cvsd\r\n\
# audio/vorbis\r\n\
# audio/vorbis-config\r\n\
audio/webm					weba\r\n\
audio/x-aac					aac\r\n\
audio/x-aiff					aif aiff aifc\r\n\
audio/x-mpegurl					m3u\r\n\
audio/x-ms-wax					wax\r\n\
audio/x-ms-wma					wma\r\n\
audio/x-pn-realaudio				ram ra\r\n\
audio/x-pn-realaudio-plugin			rmp\r\n\
audio/x-wav					wav\r\n\
chemical/x-cdx					cdx\r\n\
chemical/x-cif					cif\r\n\
chemical/x-cmdf					cmdf\r\n\
chemical/x-cml					cml\r\n\
chemical/x-csml					csml\r\n\
# chemical/x-pdb\r\n\
chemical/x-xyz					xyz\r\n\
image/bmp					bmp\r\n\
image/cgm					cgm\r\n\
# image/example\r\n\
# image/fits\r\n\
image/g3fax					g3\r\n\
image/gif					gif\r\n\
image/ief					ief\r\n\
# image/jp2\r\n\
image/jpeg					jpeg jpg jpe\r\n\
# image/jpm\r\n\
# image/jpx\r\n\
image/ktx					ktx\r\n\
# image/naplps\r\n\
image/png					png\r\n\
image/prs.btif					btif\r\n\
# image/prs.pti\r\n\
image/svg+xml					svg svgz\r\n\
# image/t38\r\n\
image/tiff					tiff tif\r\n\
# image/tiff-fx\r\n\
image/vnd.adobe.photoshop			psd\r\n\
# image/vnd.cns.inf2\r\n\
image/vnd.dece.graphic				uvi uvvi uvg uvvg\r\n\
image/vnd.dvb.subtitle				sub\r\n\
image/vnd.djvu					djvu djv\r\n\
image/vnd.dwg					dwg\r\n\
image/vnd.dxf					dxf\r\n\
image/vnd.fastbidsheet				fbs\r\n\
image/vnd.fpx					fpx\r\n\
image/vnd.fst					fst\r\n\
image/vnd.fujixerox.edmics-mmr			mmr\r\n\
image/vnd.fujixerox.edmics-rlc			rlc\r\n\
# image/vnd.globalgraphics.pgb\r\n\
# image/vnd.microsoft.icon\r\n\
# image/vnd.mix\r\n\
image/vnd.ms-modi				mdi\r\n\
image/vnd.net-fpx				npx\r\n\
# image/vnd.radiance\r\n\
# image/vnd.sealed.png\r\n\
# image/vnd.sealedmedia.softseal.gif\r\n\
# image/vnd.sealedmedia.softseal.jpg\r\n\
# image/vnd.svf\r\n\
image/vnd.wap.wbmp				wbmp\r\n\
image/vnd.xiff					xif\r\n\
image/webp					webp\r\n\
image/x-cmu-raster				ras\r\n\
image/x-cmx					cmx\r\n\
image/x-freehand				fh fhc fh4 fh5 fh7\r\n\
image/x-icon					ico\r\n\
image/x-pcx					pcx\r\n\
image/x-pict					pic pct\r\n\
image/x-portable-anymap				pnm\r\n\
image/x-portable-bitmap				pbm\r\n\
image/x-portable-graymap			pgm\r\n\
image/x-portable-pixmap				ppm\r\n\
image/x-rgb					rgb\r\n\
image/x-xbitmap					xbm\r\n\
image/x-xpixmap					xpm\r\n\
image/x-xwindowdump				xwd\r\n\
# message/cpim\r\n\
# message/delivery-status\r\n\
# message/disposition-notification\r\n\
# message/example\r\n\
# message/external-body\r\n\
# message/feedback-report\r\n\
# message/global\r\n\
# message/global-delivery-status\r\n\
# message/global-disposition-notification\r\n\
# message/global-headers\r\n\
# message/http\r\n\
# message/imdn+xml\r\n\
# message/news\r\n\
# message/partial\r\n\
message/rfc822					eml mime\r\n\
# message/s-http\r\n\
# message/sip\r\n\
# message/sipfrag\r\n\
# message/tracking-status\r\n\
# message/vnd.si.simp\r\n\
# model/example\r\n\
model/iges					igs iges\r\n\
model/mesh					msh mesh silo\r\n\
model/vnd.collada+xml				dae\r\n\
model/vnd.dwf					dwf\r\n\
# model/vnd.flatland.3dml\r\n\
model/vnd.gdl					gdl\r\n\
# model/vnd.gs-gdl\r\n\
# model/vnd.gs.gdl\r\n\
model/vnd.gtw					gtw\r\n\
# model/vnd.moml+xml\r\n\
model/vnd.mts					mts\r\n\
# model/vnd.parasolid.transmit.binary\r\n\
# model/vnd.parasolid.transmit.text\r\n\
model/vnd.vtu					vtu\r\n\
model/vrml					wrl vrml\r\n\
# multipart/alternative\r\n\
# multipart/appledouble\r\n\
# multipart/byteranges\r\n\
# multipart/digest\r\n\
# multipart/encrypted\r\n\
# multipart/example\r\n\
# multipart/form-data\r\n\
# multipart/header-set\r\n\
# multipart/mixed\r\n\
# multipart/parallel\r\n\
# multipart/related\r\n\
# multipart/report\r\n\
# multipart/signed\r\n\
# multipart/voice-message\r\n\
# text/1d-interleaved-parityfec\r\n\
text/calendar					ics ifb\r\n\
text/css					css\r\n\
text/csv					csv\r\n\
# text/directory\r\n\
# text/dns\r\n\
# text/ecmascript\r\n\
# text/enriched\r\n\
# text/example\r\n\
# text/fwdred\r\n\
text/html					html htm\r\n\
# text/javascript\r\n\
text/n3						n3\r\n\
# text/parityfec\r\n\
text/plain					txt text conf def list log in\r\n\
# text/prs.fallenstein.rst\r\n\
text/prs.lines.tag				dsc\r\n\
# text/vnd.radisys.msml-basic-layout\r\n\
# text/red\r\n\
# text/rfc822-headers\r\n\
text/richtext					rtx\r\n\
# text/rtf\r\n\
# text/rtp-enc-aescm128\r\n\
# text/rtx\r\n\
text/sgml					sgml sgm\r\n\
# text/t140\r\n\
text/tab-separated-values			tsv\r\n\
text/troff					t tr roff man me ms\r\n\
text/turtle					ttl\r\n\
# text/ulpfec\r\n\
text/uri-list					uri uris urls\r\n\
text/vcard					vcard\r\n\
# text/vnd.abc\r\n\
text/vnd.curl					curl\r\n\
text/vnd.curl.dcurl				dcurl\r\n\
text/vnd.curl.scurl				scurl\r\n\
text/vnd.curl.mcurl				mcurl\r\n\
# text/vnd.dmclientscript\r\n\
text/vnd.dvb.subtitle				sub\r\n\
# text/vnd.esmertec.theme-descriptor\r\n\
text/vnd.fly					fly\r\n\
text/vnd.fmi.flexstor				flx\r\n\
text/vnd.graphviz				gv\r\n\
text/vnd.in3d.3dml				3dml\r\n\
text/vnd.in3d.spot				spot\r\n\
# text/vnd.iptc.newsml\r\n\
# text/vnd.iptc.nitf\r\n\
# text/vnd.latex-z\r\n\
# text/vnd.motorola.reflex\r\n\
# text/vnd.ms-mediapackage\r\n\
# text/vnd.net2phone.commcenter.command\r\n\
# text/vnd.si.uricatalogue\r\n\
text/vnd.sun.j2me.app-descriptor		jad\r\n\
# text/vnd.trolltech.linguist\r\n\
# text/vnd.wap.si\r\n\
# text/vnd.wap.sl\r\n\
text/vnd.wap.wml				wml\r\n\
text/vnd.wap.wmlscript				wmls\r\n\
text/x-asm					s asm\r\n\
text/x-c					c cc cxx cpp h hh dic\r\n\
text/x-fortran					f for f77 f90\r\n\
text/x-pascal					p pas\r\n\
text/x-java-source				java\r\n\
text/x-setext					etx\r\n\
text/x-uuencode					uu\r\n\
text/x-vcalendar				vcs\r\n\
text/x-vcard					vcf\r\n\
# text/xml\r\n\
# text/xml-external-parsed-entity\r\n\
# video/1d-interleaved-parityfec\r\n\
video/3gpp					3gp\r\n\
# video/3gpp-tt\r\n\
video/3gpp2					3g2\r\n\
# video/bmpeg\r\n\
# video/bt656\r\n\
# video/celb\r\n\
# video/dv\r\n\
# video/example\r\n\
video/h261					h261\r\n\
video/h263					h263\r\n\
# video/h263-1998\r\n\
# video/h263-2000\r\n\
video/h264					h264\r\n\
# video/h264-rcdo\r\n\
# video/h264-svc\r\n\
video/jpeg					jpgv\r\n\
# video/jpeg2000\r\n\
video/jpm					jpm jpgm\r\n\
video/mj2					mj2 mjp2\r\n\
# video/mp1s\r\n\
# video/mp2p\r\n\
# video/mp2t\r\n\
video/mp4					mp4 mp4v mpg4\r\n\
# video/mp4v-es\r\n\
video/mpeg					mpeg mpg mpe m1v m2v\r\n\
# video/mpeg4-generic\r\n\
# video/mpv\r\n\
# video/nv\r\n\
video/ogg					ogv\r\n\
# video/parityfec\r\n\
# video/pointer\r\n\
video/quicktime					qt mov\r\n\
# video/raw\r\n\
# video/rtp-enc-aescm128\r\n\
# video/rtx\r\n\
# video/smpte292m\r\n\
# video/ulpfec\r\n\
# video/vc1\r\n\
# video/vnd.cctv\r\n\
video/vnd.dece.hd				uvh uvvh\r\n\
video/vnd.dece.mobile				uvm uvvm\r\n\
# video/vnd.dece.mp4\r\n\
video/vnd.dece.pd				uvp uvvp\r\n\
video/vnd.dece.sd				uvs uvvs\r\n\
video/vnd.dece.video				uvv uvvv\r\n\
# video/vnd.directv.mpeg\r\n\
# video/vnd.directv.mpeg-tts\r\n\
# video/vnd.dlna.mpeg-tts\r\n\
video/vnd.dvb.file				dvb\r\n\
video/vnd.fvt					fvt\r\n\
# video/vnd.hns.video\r\n\
# video/vnd.iptvforum.1dparityfec-1010\r\n\
# video/vnd.iptvforum.1dparityfec-2005\r\n\
# video/vnd.iptvforum.2dparityfec-1010\r\n\
# video/vnd.iptvforum.2dparityfec-2005\r\n\
# video/vnd.iptvforum.ttsavc\r\n\
# video/vnd.iptvforum.ttsmpeg2\r\n\
# video/vnd.motorola.video\r\n\
# video/vnd.motorola.videop\r\n\
video/vnd.mpegurl				mxu m4u\r\n\
video/vnd.ms-playready.media.pyv		pyv\r\n\
# video/vnd.nokia.interleaved-multimedia\r\n\
# video/vnd.nokia.videovoip\r\n\
# video/vnd.objectvideo\r\n\
# video/vnd.sealed.mpeg1\r\n\
# video/vnd.sealed.mpeg4\r\n\
# video/vnd.sealed.swf\r\n\
# video/vnd.sealedmedia.softseal.mov\r\n\
video/vnd.uvvu.mp4				uvu uvvu\r\n\
video/vnd.vivo					viv\r\n\
video/webm					webm\r\n\
video/x-f4v					f4v\r\n\
video/x-fli					fli\r\n\
video/x-flv					flv\r\n\
video/x-m4v					m4v\r\n\
video/x-ms-asf					asf asx\r\n\
video/x-ms-wm					wm\r\n\
video/x-ms-wmv					wmv\r\n\
video/x-ms-wmx					wmx\r\n\
video/x-ms-wvx					wvx\r\n\
video/x-msvideo					avi\r\n\
video/x-sgi-movie				movie\r\n\
x-conference/x-cooltalk				ice\r\n\
';

var nodeTypes = '# What: Google Chrome Extension\r\n\
# Why: To allow apps to (work) be served with the right content type header.\r\n\
# http://codereview.chromium.org/2830017\r\n\
# Added by: niftylettuce\r\n\
application/x-chrome-extension  crx\r\n\
\r\n\
# What: OTF Message Silencer\r\n\
# Why: To silence the "Resource interpreted as font but transferred with MIME\r\n\
# type font/otf" message that occurs in Google Chrome\r\n\
# Added by: niftylettuce\r\n\
font/opentype  otf\r\n\
\r\n\
# What: HTC support\r\n\
# Why: To properly render .htc files such as CSS3PIE\r\n\
# Added by: niftylettuce\r\n\
text/x-component  htc\r\n\
\r\n\
# What: HTML5 application cache manifest\r\n\
# Why: De-facto standard. Required by Mozilla browser when serving HTML5 apps\r\n\
# per https://developer.mozilla.org/en/offline_resources_in_firefox\r\n\
# Added by: louisremi\r\n\
text/cache-manifest  appcache manifest\r\n\
\r\n\
# What: node binary buffer format\r\n\
# Why: semi-standard extension w/in the node community\r\n\
# Added by: tootallnate\r\n\
application/octet-stream  buffer\r\n\
\r\n\
# What: The "protected" MP-4 formats used by iTunes.\r\n\
# Why: Required for streaming music to browsers (?)\r\n\
# Added by: broofa\r\n\
application/mp4  m4p\r\n\
audio/mp4  m4a\r\n\
\r\n\
# What: Music playlist format (http://en.wikipedia.org/wiki/M3U)\r\n\
# Why: See https://github.com/bentomas/node-mime/pull/6\r\n\
# Added by: mjrusso\r\n\
application/x-mpegURL  m3u8\r\n\
\r\n\
# What: Video format, Part of RFC1890\r\n\
# Why: See https://github.com/bentomas/node-mime/pull/6\r\n\
# Added by: mjrusso\r\n\
video/MP2T  ts\r\n\
\r\n\
# What: The FLAC lossless codec format\r\n\
# Why: Streaming and serving FLAC audio\r\n\
# Added by: jacobrask\r\n\
audio/flac  flac';
	
var mime = module.exports = {
  // Map of extension to mime type
  types: Object.create(null),

  // Map of mime type to extension
  extensions :Object.create(null),

  /**
   * Define mimetype -> extension mappings.  Each key is a mime-type that maps
   * to an array of extensions associated with the type.  The first extension is
   * used as the default extension for the type.
   *
   * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
   *
   * @param map (Object) type definitions
   */
  define: function(map) {
    for (var type in map) {
      var exts = map[type];

      for (var i = 0; i < exts.length; i++) {
        mime.types[exts[i]] = type;
      }

      // Default extension is the first one we encounter
      if (!mime.extensions[type]) {
        mime.extensions[type] = exts[0];
      }
    }
  },

  /**
   * Load an Apache2-style ".types" file
   *
   * This may be called multiple times (it's expected).  Where files declare
   * overlapping types/extensions, the last file wins.
   *
   * @param file (String) path of file to load.
   */
  load: function(file) {
    // Read file and split into lines
    var map = {},
        content = file,
        lines = content.split(/[\r\n]+/);
    lines.forEach(function(line, lineno) {
      // Clean up whitespace/comments, and split into fields
      var fields = line.replace(/\s*#.*|^\s*|\s*$/g, '').split(/\s+/);
      map[fields.shift()] = fields;
    });

    mime.define(map);
  },

  /**
   * Lookup a mime type based on extension
   */
  lookup: function(path, fallback) {
    var ext = path.replace(/.*[\.\/]/, '').toLowerCase();

    return mime.types[ext] || fallback || mime.default_type
  },

  /**
   * Return file extension associated with a mime type
   */
  extension: function(mimeType) {
    return mime.extensions[mimeType];
  },

  /**
   * Lookup a charset based on mime type.
   */
  charsets: {
    lookup: function (mimeType, fallback) {
      // Assume text types are utf8.  Modify mime logic as needed.
      return (/^text\//).test(mimeType) ? 'UTF-8' : fallback;
    }
  }
};

// Load our local copy of
// http://svn.apache.org/repos/asf/httpd/httpd/trunk/docs/conf/mime.types
mime.load(mimeTypes);

// Overlay enhancements submitted by the node.js community
mime.load(nodeTypes);

// Set the default type
mime.default_type = mime.types.bin;
