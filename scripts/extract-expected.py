"""Independent OOXML fixture extraction, without ExcelJS or application parsers."""
import json
import pathlib
import xml.etree.ElementTree as ET
import zipfile

NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
MAPPINGS = {
    "coupang": {"orderId":"주문번호", "receiverName":"수취인이름", "receiverPhone1":"수취인전화번호", "postalCode":"우편번호", "address":"수취인 주소", "productName":"등록옵션명", "optionName":"등록옵션명", "quantity":"구매수(수량)", "deliveryMessage":"배송메세지"},
    "smartstore": {"orderId":"주문번호", "productOrderId":"상품주문번호", "receiverName":"수취인명", "receiverPhone1":"수취인연락처1", "receiverPhone2":"수취인연락처2", "postalCode":"우편번호", "address":"통합배송지", "productName":"상품명", "optionName":"옵션정보", "quantity":"수량", "deliveryMessage":"배송메세지"},
    "toss": {"orderId":"주문번호", "productOrderId":"주문상품번호", "receiverName":"수령인명", "receiverPhone1":"수령인 연락처", "postalCode":"우편번호", "address":"배송지", "productName":"상품명", "optionName":"옵션명", "quantity":"주문건수", "deliveryMessage":"주문요청사항"},
}
expected = {}
for platform, mapping in MAPPINGS.items():
    with zipfile.ZipFile(pathlib.Path("samples") / f"{platform}.xlsx") as archive:
        strings = ["".join(item.itertext()) for item in ET.fromstring(archive.read("xl/sharedStrings.xml")).findall("s:si", NS)] if "xl/sharedStrings.xml" in archive.namelist() else []
        rows = ET.fromstring(archive.read("xl/worksheets/sheet1.xml")).findall("s:sheetData/s:row", NS)
        def row_values(row):
            values = {}
            for cell in row:
                value = cell.find("s:v", NS)
                value = value.text if value is not None else "".join(cell.itertext())
                if cell.get("t") == "s": value = strings[int(value)]
                values["".join(c for c in cell.get("r") if c.isalpha())] = value or ""
            return values
        header_index = 0 if platform == "coupang" else 1
        headers = {value: key for key, value in row_values(rows[header_index]).items()}
        expected[platform] = []
        for row in rows[3 if platform == "toss" else header_index + 1:]:
            source = row_values(row)
            record = {key:source.get(headers[value], "") for key, value in mapping.items()}
            record["quantity"] = int(record["quantity"])
            expected[platform].append(record)
pathlib.Path("samples/expected.json").write_text(json.dumps(expected, ensure_ascii=False, indent=2))
print("Extracted independent expected values for", sum(map(len,expected.values())), "orders; private fixture ignored by Git.")
